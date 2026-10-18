// WebGL2 spiral galaxy for the home page hero.
//
// Arms follow the density wave model: every star moves on an ellipse whose
// orientation turns a little with radius, and the arms appear where those
// orbits crowd together. The pattern stays put while each star travels at
// its own speed. Orbits are computed in the vertex shader, so a frame costs
// the CPU almost nothing. See https://beltoforion.de/en/spiral_galaxy_renderer

export type GalaxyGLOptions = {
  stars?: number
  center?: (w: number, h: number) => [number, number]
  radius?: (w: number, h: number) => number
  intro?: boolean
}

export type GalaxyGL = ReturnType<typeof createGalaxyGL>

// Particle kinds, drawn in this order
const BG = 3, STAR = 0, DUST = 1, NEBULA = 2, CORE = 4, NOVA = 5

const POINT_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aOrbit;  // radius, start angle, height, arm phase offset
layout(location = 1) in vec4 aLook;   // size, temperature, brightness, kind

uniform float uTime, uTwist, uYaw, uPitch, uDist, uDpr, uScale, uLight, uFade;
uniform vec2 uCenter, uViewport, uMouse, uParallax;
uniform vec4 uNova; // x, z in the galaxy plane, start time, unused

out vec3 vColor;
out float vAlpha;
flat out int vKind;

// Star color from temperature: 0 cool and orange, 0.5 sun-like, 1 hot and blue
vec3 starColor(float t) {
  vec3 cool = vec3(1.0, 0.6, 0.36), sun = vec3(1.0, 0.94, 0.84), hot = vec3(0.62, 0.78, 1.0);
  return t < 0.5 ? mix(cool, sun, t * 2.0) : mix(sun, hot, (t - 0.5) * 2.0);
}

// The same stars as ink on a light sky
vec3 inkColor(float t) {
  vec3 warm = vec3(0.71, 0.33, 0.04), violet = vec3(0.43, 0.16, 0.85), teal = vec3(0.05, 0.45, 0.56);
  return t < 0.5 ? mix(warm, violet, t * 2.0) : mix(violet, teal, (t - 0.5) * 2.0);
}

vec2 rotate(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  int kind = int(aLook.w + 0.5);
  vKind = kind;
  float size = aLook.x;
  float bright = aLook.z;
  vec3 color = mix(starColor(aLook.y), inkColor(aLook.y), uLight);

  // Background stars sit on the screen with a little parallax
  if (kind == ${BG}) {
    vec2 px = aOrbit.xy * uViewport + uParallax * (0.4 + aLook.y);
    gl_Position = vec4(px / uViewport * 2.0 - 1.0, 0.0, 1.0);
    gl_Position.y = -gl_Position.y;
    gl_PointSize = size * uDpr;
    vColor = color;
    vAlpha = bright * (0.55 + 0.45 * sin(uTime * (0.6 + aLook.y) + aOrbit.z * 40.0)) * mix(1.0, 0.45, uLight) * uFade;
    return;
  }

  // Position on the star's elliptical orbit
  float a = aOrbit.x;
  float ecc = 0.3 * smoothstep(0.05, 0.3, a) * (1.0 - smoothstep(0.75, 1.2, a));
  float speed = 1.0 - exp(-a / 0.07);               // flat rotation curve
  float ang = aOrbit.y + uTime * 0.05 * speed / max(a, 0.03);
  vec2 p = rotate(vec2(cos(ang) * a, sin(ang) * a * (1.0 - ecc)), a * uTwist);
  // Orbits crowd near the ends of their long axis: that is where the arms are
  float arm = pow(abs(cos(ang + aOrbit.w)), 6.0);

  if (kind == ${CORE}) { p = vec2(0.0); arm = 1.0; }
  if (kind == ${NOVA}) { p = uNova.xy; }

  vec3 world = vec3(p.x, aOrbit.z, p.y);

  // Supernova: a shock wave pushes stars outward and lights them up
  float age = uTime - uNova.z;
  float boost = 1.0;
  if (age > 0.0 && age < 6.0 && kind != ${NOVA}) {
    vec2 d = p - uNova.xy;
    float dist = length(d);
    float shell = exp(-pow((dist - age * 0.55) / 0.06, 2.0)) * exp(-age * 0.9);
    world.xz += (d / max(dist, 1e-4)) * shell * 0.07;
    boost += shell * 3.0;
  }

  // Camera: turn, tilt, then perspective
  vec3 r = vec3(rotate(world.xz, uYaw), world.y).xzy;
  r = vec3(r.x, r.y * cos(uPitch) - r.z * sin(uPitch), r.y * sin(uPitch) + r.z * cos(uPitch));
  float persp = uDist / max(uDist - r.z, 0.05);
  vec2 screen = uCenter + vec2(r.x, -r.y) * persp * uScale;
  gl_Position = vec4(screen / uViewport * 2.0 - 1.0, 0.0, 1.0);
  gl_Position.y = -gl_Position.y;

  // The pointer works like a flashlight on nearby stars
  float lit = 1.0 + 0.9 * exp(-pow(length(screen - uMouse) / 120.0, 2.0));
  float scale = uScale / 420.0;

  if (kind == ${STAR}) {
    // Dimmer toward the center, where thousands of stars add up to white
    bright *= (0.35 + 1.3 * arm) * boost * lit * (0.3 + 0.7 * smoothstep(0.03, 0.4, a));
    gl_PointSize = clamp(size * persp * uDpr * mix(0.8, 1.3, scale) * (0.85 + 0.25 * lit), 1.0, 8.0 * uDpr);
  } else if (kind == ${DUST}) {
    bright *= arm;
    gl_PointSize = size * persp * uDpr * scale;
    color = mix(vec3(0.05, 0.03, 0.07), vec3(0.0), 0.5);
  } else if (kind == ${NEBULA}) {
    bright *= arm * arm * boost;
    gl_PointSize = size * persp * uDpr * scale;
    color = mix(vec3(1.0, 0.36, 0.72), vec3(0.86, 0.15, 0.47), uLight);
  } else if (kind == ${CORE}) {
    gl_PointSize = size * persp * uDpr * scale;
    color = mix(vec3(1.0, 0.86, 0.66), vec3(0.98, 0.62, 0.15), uLight);
  } else {
    float k = clamp(age / 2.5, 0.0, 1.0);
    bright = age > 0.0 ? (1.0 - k) * (1.0 - k) : 0.0;
    gl_PointSize = (40.0 + 260.0 * sqrt(k)) * uDpr * scale;
    color = mix(vec3(0.85, 0.95, 1.0), vec3(0.43, 0.16, 0.85), uLight);
  }

  vColor = color;
  vAlpha = bright * uFade;
}`

const POINT_FS = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
flat in int vKind;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(c, c);
  if (d2 > 1.0) discard;
  float g;
  if (vKind == ${STAR} || vKind == ${BG}) g = exp(-d2 * 5.0) + 0.25 * exp(-d2 * 1.6);
  else g = exp(-d2 * 3.2) * (1.0 - d2);
  float a = clamp(vAlpha * g, 0.0, 1.0);
  outColor = vec4(vColor * a, a); // premultiplied
}`

// Full-screen nebula behind the galaxy
const SKY_VS = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`

const SKY_FS = `#version 300 es
precision highp float;
uniform vec2 uCenterPx, uParallax;
uniform float uScalePx, uTime, uLight, uFade;
out vec4 outColor;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) { v += amp * noise(p); p = p * 2.03 + 11.7; amp *= 0.5; }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uCenterPx) / uScalePx;
  uv.y = -uv.y;
  vec2 q = uv * 1.1 + uParallax * 0.0015;
  float n1 = fbm(q + vec2(uTime * 0.012, 0.0));
  float n2 = fbm(q * 1.7 - vec2(0.0, uTime * 0.009) + 5.0);
  float glow = exp(-dot(uv, uv) * 1.4);

  vec3 dark = vec3(0.012, 0.009, 0.04)
    + vec3(0.30, 0.12, 0.55) * pow(n1, 3.0) * 0.55
    + vec3(0.05, 0.40, 0.55) * pow(n2, 4.0) * 0.45
    + vec3(0.35, 0.22, 0.55) * glow * 0.35;
  vec3 light = vec3(0.953, 0.941, 1.0)
    - vec3(0.10, 0.12, 0.02) * pow(n1, 3.0) * 0.8
    - vec3(0.12, 0.04, 0.0) * pow(n2, 4.0) * 0.6
    - vec3(0.06, 0.08, 0.0) * glow * 0.5;
  vec3 base = mix(vec3(0.02, 0.016, 0.06), vec3(0.953, 0.941, 1.0), uLight);
  outColor = vec4(mix(base, mix(dark, light, uLight), uFade), 1.0);
}`

function gauss() {
  let u = 0, v = 0
  while (!u) u = Math.random()
  while (!v) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const program = gl.createProgram()!
  for (const [type, source] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "shader")
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "link")
  return program
}

// Builds the particles: background stars, disk stars, dust, nebulae, core and the supernova flash
function buildParticles(stars: number) {
  const counts = { bg: 2400, star: stars, dust: Math.round(stars * 0.03), nebula: Math.round(stars * 0.005) }
  const total = counts.bg + counts.star + counts.dust + counts.nebula + 2
  const orbit = new Float32Array(total * 4)
  const look = new Float32Array(total * 4)
  let i = 0
  const push = (o: number[], l: number[]) => { orbit.set(o, i * 4); look.set(l, i * 4); i++ }
  // Disk radius with an exponential falloff, or a small round bulge
  const disk = () => -0.26 * Math.log(1 - Math.random() * (1 - Math.exp(-4.2)))
  const radius = () => Math.random() < 0.12 ? Math.abs(gauss()) * 0.05 : disk()
  // Disk radius, but no closer to the center than `min`
  const outside = (min: number) => { let a = disk(); while (a < min) a = disk(); return a }

  for (let n = 0; n < counts.bg; n++) {
    push([Math.random(), Math.random(), Math.random(), 0], [rand(0.6, 1.9), Math.random(), rand(0.25, 0.8), BG])
  }
  for (let n = 0; n < counts.star; n++) {
    const a = radius()
    const bulge = Math.exp(-a / 0.09)
    const z = gauss() * (0.012 + 0.05 * bulge)
    const temp = bulge > 0.4 ? rand(0.1, 0.5) : Math.pow(Math.random(), 0.65)
    const size = 1.3 + Math.pow(Math.random(), 7) * 2.6
    push([a, rand(0, Math.PI * 2), z, 0], [size, temp, rand(0.35, 1) * (1 - bulge * 0.35), STAR])
  }
  for (let n = 0; n < counts.dust; n++) {
    push([outside(0.25), rand(0, Math.PI * 2), gauss() * 0.006, 0.35], [rand(22, 48), 0.5, 0.12, DUST])
  }
  for (let n = 0; n < counts.nebula; n++) {
    push([outside(0.15), rand(0, Math.PI * 2), gauss() * 0.008, 0], [rand(12, 32), 0.5, rand(0.2, 0.5), NEBULA])
  }
  push([0, 0, 0, 0], [90, 0.5, 0.45, CORE])
  push([0, 0, 0, 0], [1, 0.5, 1, NOVA])

  return { orbit, look, ranges: {
    additive: [0, counts.bg + counts.star],
    dust: [counts.bg + counts.star, counts.dust],
    glow: [counts.bg + counts.star + counts.dust, counts.nebula + 2],
  } }
}

// Returns null when WebGL2 is not available, so the caller can fall back to the 2D version
export function createGalaxyGL(canvas: HTMLCanvasElement, opts: GalaxyGLOptions = {}) {
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true, alpha: false, preserveDrawingBuffer: false })
  if (!gl) return null

  let points: WebGLProgram, sky: WebGLProgram
  try {
    points = compile(gl, POINT_VS, POINT_FS)
    sky = compile(gl, SKY_VS, SKY_FS)
  } catch {
    return null
  }

  const { orbit, look, ranges } = buildParticles(opts.stars ?? 60000)
  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  for (const [location, data] of [[0, orbit], [1, look]] as const) {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 0, 0)
  }
  const skyVao = gl.createVertexArray()

  const uniforms = (program: WebGLProgram, names: string[]) =>
    Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)]))
  const u = uniforms(points, ["uTime", "uTwist", "uYaw", "uPitch", "uDist", "uDpr", "uScale", "uLight", "uFade", "uCenter", "uViewport", "uMouse", "uParallax", "uNova"])
  const us = uniforms(sky, ["uCenterPx", "uParallax", "uScalePx", "uTime", "uLight", "uFade"])

  let w = 0, h = 0, dpr = 1
  let light = 0, lightTarget = 0
  let scroll = 0
  let lost = false
  let start = -1
  let stars = ranges.additive[1]
  const nova = { x: 0, z: 0, t: -100 }
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: -1e4, py: -1e4 }
  const frames: number[] = []
  let lastFrame = 0

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true })

  const center = () => opts.center ? opts.center(w, h) : [w / 2, h / 2]
  const radius = () => opts.radius ? opts.radius(w, h) : Math.min(w, h) * 0.45

  // Camera for a given moment: an intro fly-in, the pointer and the scroll position
  function camera(t: number) {
    const intro = opts.intro === false ? 1 : easeOut((t - start) / 3.2)
    return {
      yaw: -0.5 + (ptr.x - 0.5) * 0.7 + (1 - intro) * 1.4,
      pitch: 1.08 + (ptr.y - 0.5) * 0.35 + (1 - intro) * 0.42 - scroll * 0.55,
      dist: 3.2 + (1 - intro) * 5 + scroll * 1.2,
      fade: intro * (1 - scroll * 0.6),
    }
  }

  // Screen point to a point in the galaxy plane, for the supernova
  function toPlane(x: number, y: number, t: number) {
    const cam = camera(t)
    const [cx, cy] = center()
    const s = radius()
    const sx = (x - cx) / s, sy = -(y - cy) / s
    // Ray from the camera (0, 0, dist) through (sx, sy, 0), undo the pitch then the yaw
    let o = [0, 0, cam.dist], d = [sx, sy, -cam.dist]
    const unpitch = (v: number[]) => [v[0], v[1] * Math.cos(-cam.pitch) - v[2] * Math.sin(-cam.pitch), v[1] * Math.sin(-cam.pitch) + v[2] * Math.cos(-cam.pitch)]
    o = unpitch(o); d = unpitch(d)
    // Now (x, height, depth): undo the yaw in the x-depth plane
    const unyaw = (v: number[]) => {
      const c = Math.cos(-cam.yaw), s2 = Math.sin(-cam.yaw)
      return [v[0] * c - v[2] * s2, v[1], v[0] * s2 + v[2] * c]
    }
    const O = unyaw(o), D = unyaw(d)
    if (Math.abs(D[1]) < 1e-5) return null
    const k = -O[1] / D[1]
    if (k < 0) return null
    return { x: O[0] + D[0] * k, z: O[2] + D[2] * k }
  }

  return {
    get lost() { return lost },
    resize(width: number, height: number, ratio = Math.min(window.devicePixelRatio || 1, 2)) {
      w = width; h = height; dpr = ratio
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
    },
    setTheme(dark: boolean) { lightTarget = dark ? 0 : 1 },
    setScroll(progress: number) { scroll = clamp(progress, 0, 1) },
    pointer(x: number, y: number) { ptr.tx = x / w; ptr.ty = y / h; ptr.px = x; ptr.py = y },
    leave() { ptr.tx = 0.5; ptr.ty = 0.5; ptr.px = -1e4; ptr.py = -1e4 },
    supernova(x: number, y: number) {
      const t = performance.now() / 1000
      const hit = toPlane(x, y, t)
      if (hit && Math.hypot(hit.x, hit.z) < 1.4) Object.assign(nova, { ...hit, t })
    },
    draw(ms: number) {
      if (lost || !w || !h) return
      const t = ms / 1000
      if (start < 0) start = t
      ptr.x += (ptr.tx - ptr.x) * 0.04
      ptr.y += (ptr.ty - ptr.y) * 0.04
      light += (lightTarget - light) * 0.12
      if (Math.abs(lightTarget - light) < 0.01) light = lightTarget

      // Lighter load on slow devices: after the intro, drop resolution and stars once
      if (frames.length < 90) {
        if (lastFrame) frames.push(ms - lastFrame)
        if (frames.length === 90) {
          const avg = frames.slice(30).reduce((s, f) => s + f, 0) / 60
          if (avg > 24 && dpr > 1) this.resize(w, h, 1)
          if (avg > 30) stars = Math.round(ranges.additive[1] * 0.5)
        }
      }
      lastFrame = ms

      const cam = camera(t)
      const [cx, cy] = center()
      const scale = radius()
      const parallaxX = (ptr.x - 0.5) * -24, parallaxY = (ptr.y - 0.5) * -24

      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.disable(gl.DEPTH_TEST)

      gl.useProgram(sky)
      gl.bindVertexArray(skyVao)
      gl.uniform2f(us.uCenterPx, cx * dpr, (h - cy) * dpr)
      gl.uniform2f(us.uParallax, parallaxX, parallaxY)
      gl.uniform1f(us.uScalePx, scale * dpr)
      gl.uniform1f(us.uTime, t)
      gl.uniform1f(us.uLight, light)
      gl.uniform1f(us.uFade, cam.fade)
      gl.disable(gl.BLEND)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      gl.useProgram(points)
      gl.bindVertexArray(vao)
      gl.uniform1f(u.uTime, t)
      gl.uniform1f(u.uTwist, 4.6)
      gl.uniform1f(u.uYaw, cam.yaw)
      gl.uniform1f(u.uPitch, cam.pitch)
      gl.uniform1f(u.uDist, cam.dist)
      gl.uniform1f(u.uDpr, dpr)
      gl.uniform1f(u.uScale, scale)
      gl.uniform1f(u.uLight, light)
      gl.uniform1f(u.uFade, cam.fade)
      gl.uniform2f(u.uCenter, cx, cy)
      gl.uniform2f(u.uViewport, w, h)
      gl.uniform2f(u.uMouse, ptr.px, ptr.py)
      gl.uniform2f(u.uParallax, parallaxX, parallaxY)
      gl.uniform4f(u.uNova, nova.x, nova.z, nova.t, 0)

      gl.enable(gl.BLEND)
      // Light on dark adds up; ink on a light sky is layered over it
      const glow = () => light > 0.5 ? gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA) : gl.blendFunc(gl.ONE, gl.ONE)
      glow()
      gl.drawArrays(gl.POINTS, ranges.additive[0], stars)
      if (light < 0.5) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
        gl.drawArrays(gl.POINTS, ranges.dust[0], ranges.dust[1])
      }
      glow()
      gl.drawArrays(gl.POINTS, ranges.glow[0], ranges.glow[1])
    },
  }
}
