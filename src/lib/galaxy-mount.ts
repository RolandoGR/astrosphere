// Mounts the galaxy in a section that holds a <canvas>: WebGL2 when the
// browser supports it, the 2D canvas version otherwise (or if the GPU drops
// the WebGL context). Handles theme, pointer, clicks, scroll, visibility
// and reduced motion.
import { createGalaxy } from "@lib/galaxy"
import { createGalaxyGL, type GalaxyParams } from "@lib/galaxy-gl"

type Layout = {
  center: (w: number, h: number) => [number, number]
  radius: (w: number, h: number) => number
}

type Engine = {
  resize(w: number, h: number): void
  setTheme(dark: boolean): void
  pointer(x: number, y: number): void
  leave(): void
  supernova(x: number, y: number): void
  draw(t: number): void
  setScroll?(progress: number): void
  readonly lost?: boolean
}

type Options = Layout & {
  params?: Partial<GalaxyParams> // look of the WebGL galaxy (see defaultParams)
  stars: number         // WebGL star count
  fallbackStars: number // 2D star count
  scroll?: boolean      // tilt and fade the galaxy as the page scrolls past it
}

export function mountGalaxy(section: HTMLElement, options: Options) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const layout = { center: options.center, radius: options.radius }
  const isDark = () => document.documentElement.classList.contains("dark")
  let canvas = section.querySelector("canvas")!

  function create(webgl: boolean): Engine {
    const params = { ...options.params, stars: options.stars, intro: !reduced && (options.params?.intro ?? true) }
    const engine = webgl ? createGalaxyGL(canvas, { ...layout, params }) : null
    section.dataset.galaxy = engine ? "webgl" : "canvas"
    return engine ?? createGalaxy(canvas, { ...layout, count: options.fallbackStars })
  }

  let engine = create(true)
  engine.setTheme(isDark())

  let raf = 0
  let visible = true
  const redrawIfIdle = () => {
    if (reduced || !visible) engine.draw(performance.now())
  }

  // A fresh canvas is needed to switch from WebGL to 2D
  function fallBackTo2D() {
    const fresh = canvas.cloneNode(false) as HTMLCanvasElement
    canvas.replaceWith(fresh)
    canvas = fresh
    engine = create(false)
    engine.setTheme(isDark())
    engine.resize(section.clientWidth, section.clientHeight)
  }

  const frame = (t: number) => {
    if (engine.lost) fallBackTo2D()
    engine.draw(t)
    raf = requestAnimationFrame(frame)
  }
  const start = () => {
    if (reduced) engine.draw(performance.now())
    else if (!raf) raf = requestAnimationFrame(frame)
  }
  const stop = () => {
    cancelAnimationFrame(raf)
    raf = 0
  }

  new ResizeObserver(() => {
    engine.resize(section.clientWidth, section.clientHeight)
    redrawIfIdle()
  }).observe(section)

  // Only animate while the section is on screen
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) start()
    else stop()
  }).observe(section)

  new MutationObserver(() => {
    engine.setTheme(isDark())
    redrawIfIdle()
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

  if (options.scroll) {
    const onScroll = () => {
      engine.setScroll?.(window.scrollY / Math.max(section.offsetHeight, 1))
      redrawIfIdle()
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
  }

  const local = (e: PointerEvent | MouseEvent) => {
    const rect = section.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top] as const
  }
  section.addEventListener("pointermove", (e) => engine.pointer(...local(e)))
  section.addEventListener("pointerleave", () => engine.leave())
  section.addEventListener("click", (e) => {
    if (reduced || (e.target as Element).closest("a, button")) return
    engine.supernova(...local(e))
  })
}
