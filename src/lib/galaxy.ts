// Canvas spiral galaxy for the home page hero. It tilts with the pointer,
// spawns a supernova on click and has a palette for each theme.

type Palette = {
  bg: [string, string, string]
  star: string
  halo: [string, string]
  core: [string, string, string]
  nova: [string, string, string]
  colors: string[]
  blend: GlobalCompositeOperation
  alpha: number
}

type Rgb = [number, number, number]

const mix = (a: Rgb, b: Rgb, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`

// Colors 0-1 are the warm core, 2 is the pink accent and 3-7 run along the arms
const ramp = (from: Rgb, to: Rgb) => Array.from({ length: 5 }, (_, i) => mix(from, to, i / 4))

const DARK: Palette = {
  bg: ["#1a1235", "#0a0820", "#020207"],
  star: "#ffffff",
  halo: ["rgba(167,139,250,.22)", "rgba(34,211,238,0)"],
  core: ["rgba(255,248,235,.95)", "rgba(255,210,170,.35)", "rgba(255,180,140,0)"],
  nova: ["255,255,255", "103,232,249", "196,181,253"],
  colors: ["#fff4e6", "#ffd6aa", "#ff82d2", ...ramp([196, 181, 253], [103, 232, 249])],
  blend: "lighter",
  alpha: 1,
}

const LIGHT: Palette = {
  bg: ["#e9e3ff", "#f3f0ff", "#fcfbff"],
  star: "#312e81",
  halo: ["rgba(124,58,237,.12)", "rgba(124,58,237,0)"],
  core: ["rgba(251,191,36,.75)", "rgba(249,115,22,.22)", "rgba(249,115,22,0)"],
  nova: ["124,58,237", "8,145,178", "109,40,217"],
  colors: ["#b45309", "#d97706", "#db2777", ...ramp([109, 40, 217], [14, 116, 144])],
  blend: "source-over",
  alpha: 0.8,
}

type Particle = { r: number; theta: number; z: number; size: number; alpha: number; color: number }
type Nova = { x: number; y: number; start: number }

export type GalaxyOptions = {
  count?: number
  center?: (w: number, h: number) => [number, number]
  radius?: (w: number, h: number) => number
}

function gauss() {
  let u = 0, v = 0
  while (!u) u = Math.random()
  while (!v) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function createGalaxy(canvas: HTMLCanvasElement, opts: GalaxyOptions = {}) {
  let ctx: CanvasRenderingContext2D | null = null
  let w = 0, h = 0
  let palette = DARK

  const ARMS = 3
  const particles: Particle[] = Array.from({ length: opts.count ?? 4200 }, (_, i) => {
    const disk = Math.random() < 0.18
    const r = disk ? Math.pow(Math.random(), 0.8) : Math.pow(Math.random(), 0.9) * 0.97 + 0.03
    const spread = disk ? rand(0, Math.PI * 2) : gauss() * 0.16 * (0.4 + r)
    let color: number
    if (r < 0.13) color = Math.random() < 0.5 ? 0 : 1
    else if (Math.random() < 0.12) color = 2
    else color = 3 + Math.min(4, Math.floor(r * 1.25 * 5))
    return {
      r,
      theta: (i % ARMS) * 2 * Math.PI / ARMS + r * 7.2 + spread,
      z: gauss() * 0.05 * (1 - r * 0.7),
      size: Math.random() < 0.05 ? 2.2 : rand(0.8, 1.6),
      alpha: rand(0.35, 0.95),
      color,
    }
  })
  const stars = Array.from({ length: 260 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.3, 1.5), p: rand(0, 6.28) }))
  const novas: Nova[] = []
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }

  const center = () => opts.center ? opts.center(w, h) : [w / 2, h / 2]
  const radius = () => opts.radius ? opts.radius(w, h) : Math.min(w, h) * 0.45

  return {
    resize(width: number, height: number, dpr = Math.min(window.devicePixelRatio || 1, 2)) {
      w = width
      h = height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx = canvas.getContext("2d")
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    },
    setTheme(dark: boolean) {
      palette = dark ? DARK : LIGHT
    },
    pointer(x: number, y: number) {
      ptr.tx = x / w
      ptr.ty = y / h
    },
    leave() {
      ptr.tx = 0.5
      ptr.ty = 0.5
    },
    supernova(x: number, y: number) {
      novas.push({ x, y, start: performance.now() })
    },
    draw(t: number) {
      if (!ctx || !w || !h) return
      const c = ctx
      const p = palette
      ptr.x += (ptr.tx - ptr.x) * 0.05
      ptr.y += (ptr.ty - ptr.y) * 0.05
      const [cx, cy] = center()
      const R = radius()

      c.globalCompositeOperation = "source-over"
      c.globalAlpha = 1
      const bg = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.85)
      bg.addColorStop(0, p.bg[0])
      bg.addColorStop(0.45, p.bg[1])
      bg.addColorStop(1, p.bg[2])
      c.fillStyle = bg
      c.fillRect(0, 0, w, h)

      c.fillStyle = p.star
      for (const s of stars) {
        c.globalAlpha = (0.25 + 0.6 * Math.abs(Math.sin(t * 0.0008 + s.p))) * p.alpha
        c.fillRect(s.x * w - (ptr.x - 0.5) * 14, s.y * h - (ptr.y - 0.5) * 14, s.s, s.s)
      }

      const tilt = clamp(0.36 + (ptr.y - 0.5) * 0.6, 0.12, 0.85)
      const rot = t * 0.00006
      c.save()
      c.translate(cx, cy)
      c.rotate(-0.42 + (ptr.x - 0.5) * 0.35)
      c.globalCompositeOperation = p.blend

      const halo = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.9)
      halo.addColorStop(0, p.halo[0])
      halo.addColorStop(1, p.halo[1])
      c.globalAlpha = 1
      c.fillStyle = halo
      c.save()
      c.scale(1, tilt)
      c.beginPath()
      c.arc(0, 0, R * 0.9, 0, Math.PI * 2)
      c.fill()
      c.restore()

      for (const q of particles) {
        const a = q.theta + rot
        c.globalAlpha = q.alpha * p.alpha
        c.fillStyle = p.colors[q.color]
        c.fillRect(Math.cos(a) * q.r * R, Math.sin(a) * q.r * R * tilt + q.z * R, q.size, q.size)
      }

      const core = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.22)
      core.addColorStop(0, p.core[0])
      core.addColorStop(0.35, p.core[1])
      core.addColorStop(1, p.core[2])
      c.globalAlpha = 1
      c.fillStyle = core
      c.beginPath()
      c.arc(0, 0, R * 0.22, 0, Math.PI * 2)
      c.fill()
      c.restore()

      const now = performance.now()
      for (let i = novas.length - 1; i >= 0; i--) {
        const n = novas[i]
        const k = (now - n.start) / 1600
        if (k > 1) {
          novas.splice(i, 1)
          continue
        }
        const size = 120 * (0.3 + k)
        const flash = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, size)
        flash.addColorStop(0, `rgba(${p.nova[0]},${0.9 * (1 - k)})`)
        flash.addColorStop(0.3, `rgba(${p.nova[1]},${0.4 * (1 - k)})`)
        flash.addColorStop(1, `rgba(${p.nova[2]},0)`)
        c.fillStyle = flash
        c.beginPath()
        c.arc(n.x, n.y, size, 0, Math.PI * 2)
        c.fill()
        c.strokeStyle = `rgba(${p.nova[2]},${1 - k})`
        c.lineWidth = 2 * (1 - k) + 0.5
        c.beginPath()
        c.arc(n.x, n.y, 260 * k, 0, Math.PI * 2)
        c.stroke()
      }
      c.globalCompositeOperation = "source-over"
      c.globalAlpha = 1
    },
  }
}
