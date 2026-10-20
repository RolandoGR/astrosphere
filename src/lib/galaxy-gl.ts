// WebGL2 spiral galaxy for the home page hero.
//
// Arms follow the density wave model: every star moves on an oval orbit whose
// orientation turns a little with radius, and the arms appear where those
// orbits crowd together. The pattern stays put while each star travels at its
// own speed. Orbits are computed in the vertex shader, so a frame costs the
// CPU almost nothing. See https://beltoforion.de/en/spiral_galaxy_renderer
//
// Every visual choice is a parameter (GalaxyParams), so the look can be tuned
// live; the galaxy lab uses setParams() for that.

export type Palette = "realistic" | "brand" | "aurora" | "mono" | "ember" | "teal"

export type GalaxyParams = {
  // Shape
  arms: number          // number of spiral arms (1-5)
  twist: number         // how much the orbits turn from center to edge, in radians
  lobe: number          // how oval the orbits are; more makes arms denser
  armContrast: number   // brightness difference between arms and the space between them
  thickness: number     // disk height
  bulge: number         // share of stars in the round central bulge
  coreGlow: number      // brightness of the glow at the center
  innerDim: number      // dims the crowded center so it doesn't blow out to white
  // Stars and look
  stars: number
  bgStars: number
  nebulae: number       // amount of glowing clouds along the arms
  dust: number          // amount of dark dust along the arms
  palette: Palette
  colorBy: "temperature" | "radius" | "arm"
  starSize: number
  brightness: number
  sprite: "glow" | "dot" | "square"
  twinkle: number
  sky: number           // intensity of the background nebula
  // Motion and data-art
  speed: number         // orbital speed
  trails: number        // 0 clears every frame; closer to 1 leaves longer streaks
  orbitLines: number    // opacity of the orbit guide lines (0 hides them)
  orbitLineCount: number
  // Camera
  tilt: number          // 0 is edge-on, about 1.57 is face-on
  roll: number          // turns the whole image on screen
  yaw: number           // turns the galaxy around its own axis
  distance: number      // camera distance, for perspective
  autoSpin: number      // slow turn around the galaxy axis, radians per second
  parallax: number      // how much the camera follows the pointer
  intro: boolean        // camera fly-in on load
  scrollMode: "none" | "tilt" | "dive" | "spin"
  // Interaction
  pointerMode: "none" | "flashlight" | "gravity" | "repel"
  pointerRadius: number // in CSS pixels
  pointerStrength: number
  clickMode: "none" | "supernova" | "ripple"
  clickStrength: number
  // Layout, relative to the page's own position and size for the galaxy
  offsetX: number       // share of the width
  offsetY: number       // share of the height
  scale: number
}

export const defaultParams: GalaxyParams = {
  arms: 2, twist: 4.6, lobe: 0.3, armContrast: 1.3, thickness: 0.012, bulge: 0.12, coreGlow: 1, innerDim: 0.7,
  stars: 60000, bgStars: 2400, nebulae: 1, dust: 1, palette: "realistic", colorBy: "temperature",
  starSize: 1, brightness: 1, sprite: "glow", twinkle: 0, sky: 1,
  speed: 1, trails: 0, orbitLines: 0, orbitLineCount: 24,
  tilt: 1.08, roll: 0, yaw: -0.5, distance: 3.2, autoSpin: 0, parallax: 1, intro: true, scrollMode: "tilt",
  pointerMode: "flashlight", pointerRadius: 120, pointerStrength: 0.9, clickMode: "supernova", clickStrength: 1,
  offsetX: 0, offsetY: 0, scale: 1,
}

type Rgb = [number, number, number]
// Three star color stops, plus core, nebula and background sky colors
const palettes: Record<Palette, { stops: Rgb[]; core: Rgb; nebula: Rgb; sky: Rgb[] }> = {
  realistic: { stops: [[1, 0.6, 0.36], [1, 0.94, 0.84], [0.62, 0.78, 1]], core: [1, 0.86, 0.66], nebula: [1, 0.36, 0.72], sky: [[0.3, 0.12, 0.55], [0.05, 0.4, 0.55]] },
  brand: { stops: [[0.55, 0.36, 0.96], [0.77, 0.71, 0.99], [0.13, 0.83, 0.93]], core: [0.82, 0.88, 1], nebula: [0.45, 0.3, 0.95], sky: [[0.3, 0.12, 0.55], [0.05, 0.4, 0.55]] },
  aurora: { stops: [[0.18, 0.83, 0.75], [0.65, 0.55, 0.98], [0.96, 0.45, 0.71]], core: [0.88, 0.95, 1], nebula: [0.18, 0.83, 0.75], sky: [[0.05, 0.35, 0.4], [0.3, 0.12, 0.45]] },
  mono: { stops: [[0.62, 0.68, 0.95], [0.95, 0.96, 1], [0.6, 0.94, 1]], core: [1, 1, 1], nebula: [0.55, 0.6, 0.95], sky: [[0.12, 0.14, 0.3], [0.08, 0.2, 0.3]] },
  teal: { stops: [[0.18, 0.72, 0.66], [0.88, 0.98, 0.96], [0.4, 0.88, 1]], core: [0.92, 1, 0.98], nebula: [0.18, 0.75, 0.68], sky: [[0.04, 0.24, 0.24], [0.03, 0.16, 0.26]] },
  ember: { stops: [[0.98, 0.45, 0.09], [0.98, 0.75, 0.14], [1, 0.95, 0.8]], core: [1, 0.88, 0.66], nebula: [0.98, 0.3, 0.2], sky: [[0.4, 0.1, 0.08], [0.35, 0.18, 0.05]] },
}
const ink = (c: Rgb): Rgb => [c[0] * 0.55, c[1] * 0.5, c[2] * 0.6]

// Particle kinds, drawn in this order
const BG = 3, STAR = 0, DUST = 1, NEBULA = 2, CORE = 4, NOVA = 5

// Orbit and camera math shared by the star and line shaders
const COMMON = `
uniform float uTime, uArms, uTwist, uLobe, uSpeed;
uniform float uYaw, uPitch, uRoll, uDist, uScale;
uniform vec2 uCenter, uViewport;
uniform vec3 uPal0, uPal1, uPal2;

vec2 rotate2(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

// Orbit phase of a star at radius a: inner stars go around faster
float orbitPhase(float a, float start) {
  float v = 1.0 - exp(-a / 0.07);
  return start + uTime * 0.05 * uSpeed * v / max(a, 0.03);
}

// Position in the galaxy plane on an oval orbit turned by a * twist.
// arm is 1 where orbits crowd together (on an arm) and 0 between arms.
vec2 orbit(float a, float ang, float phase, out float arm) {
  float lobe = uLobe * smoothstep(0.05, 0.3, a) * (1.0 - smoothstep(0.75, 1.2, a));
  float r = a * (1.0 + lobe * cos(uArms * ang));
  float th = ang + a * uTwist;
  arm = pow(0.5 + 0.5 * cos(uArms * (ang + phase)), 3.0);
  return r * vec2(cos(th), sin(th));
}

// Galaxy space (x, height, z) to screen pixels
vec2 project(vec3 world, out float persp) {
  vec3 r = vec3(rotate2(world.xz, uYaw), world.y).xzy;
  r = vec3(r.x, r.y * cos(uPitch) - r.z * sin(uPitch), r.y * sin(uPitch) + r.z * cos(uPitch));
  persp = uDist / max(uDist - r.z, 0.05);
  return uCenter + rotate2(vec2(r.x, -r.y) * persp, uRoll) * uScale;
}

vec4 toClip(vec2 screen) {
  vec2 c = screen / uViewport * 2.0 - 1.0;
  return vec4(c.x, -c.y, 0.0, 1.0);
}

vec3 palette(float v) {
  v = clamp(v, 0.0, 1.0);
  return v < 0.5 ? mix(uPal0, uPal1, v * 2.0) : mix(uPal1, uPal2, v * 2.0 - 1.0);
}
`

const POINT_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aOrbit;  // radius, start phase, height, arm phase offset
layout(location = 1) in vec4 aLook;   // size, temperature, brightness, kind
${COMMON}
uniform float uDpr, uLight, uFade, uColorBy, uArmContrast, uInnerDim, uCoreGlow, uStarSize, uBrightness, uTwinkle;
uniform float uPointerMode, uPointerRadius, uPointerStrength, uClickStrength;
uniform vec2 uMouse, uParallax;
uniform vec4 uClick; // x, z in the galaxy plane, start time, mode (1 supernova, 2 ripple)
uniform vec3 uCoreColor, uNebColor;

out vec3 vColor;
out float vAlpha;
flat out int vKind;

void main() {
  int kind = int(aLook.w + 0.5);
  vKind = kind;
  float size = aLook.x;
  float bright = aLook.z * uBrightness;

  // Background stars sit on the screen with a little parallax
  if (kind == ${BG}) {
    vec2 px = aOrbit.xy * uViewport + uParallax * (0.4 + aLook.y);
    gl_Position = toClip(px);
    gl_PointSize = size * uDpr;
    vColor = palette(aLook.y);
    vAlpha = aLook.z * (0.55 + 0.45 * sin(uTime * (0.6 + aLook.y) + aOrbit.z * 40.0)) * mix(1.0, 0.45, uLight) * uFade;
    return;
  }

  float a = aOrbit.x;
  float arm;
  vec2 p = orbit(a, orbitPhase(a, aOrbit.y), aOrbit.w, arm);
  if (kind == ${CORE}) { p = vec2(0.0); arm = 1.0; }
  if (kind == ${NOVA}) { p = uClick.xy; }
  vec3 world = vec3(p.x, aOrbit.z, p.y);

  // Click effects: a supernova shock wave, or a ripple through the disk
  float age = uTime - uClick.z;
  float boost = 1.0;
  if (age > 0.0 && age < 6.0 && kind != ${NOVA}) {
    vec2 d = p - uClick.xy;
    float dist = length(d);
    if (uClick.w == 1.0) {
      float shell = exp(-pow((dist - age * 0.55) / 0.06, 2.0)) * exp(-age * 0.9);
      world.xz += (d / max(dist, 1e-4)) * shell * 0.07 * uClickStrength;
      boost += shell * 3.0 * uClickStrength;
    } else if (uClick.w == 2.0) {
      float wave = sin((dist - age * 0.5) * 28.0) * exp(-dist * 1.5) * exp(-age * 0.6) * step(dist, age * 0.5);
      world.y += wave * 0.05 * uClickStrength;
      boost += max(wave, 0.0) * 1.5 * uClickStrength;
    }
  }

  float persp;
  vec2 screen = project(world, persp);

  // Pointer: a flashlight, a gravity well or a repelling field
  vec2 toMouse = uMouse - screen;
  float near = exp(-pow(length(toMouse) / uPointerRadius, 2.0));
  float lit = 1.0;
  if (uPointerMode == 1.0) lit += uPointerStrength * near;
  else if (uPointerMode == 2.0) { screen += toMouse * near * 0.35 * uPointerStrength; lit += 0.4 * near * uPointerStrength; }
  else if (uPointerMode == 3.0) screen -= toMouse / max(length(toMouse), 1.0) * near * uPointerRadius * 0.3 * uPointerStrength;
  gl_Position = toClip(screen);

  float scale = uScale / 420.0;
  float v = uColorBy == 0.0 ? aLook.y : uColorBy == 1.0 ? a / 1.1 : arm;
  vec3 color = palette(v);

  if (kind == ${STAR}) {
    float dim = mix(1.0, 0.3 + 0.7 * smoothstep(0.03, 0.4, a), uInnerDim);
    float twinkle = 1.0 - uTwinkle * 0.5 * (1.0 + sin(uTime * 3.0 + aOrbit.y * 50.0));
    bright *= (1.0 - 0.5 * uArmContrast + uArmContrast * arm) * boost * lit * dim * twinkle;
    bright = max(bright, 0.0);
    gl_PointSize = clamp(size * uStarSize * persp * uDpr * mix(0.8, 1.3, scale) * (0.85 + 0.25 * lit), 1.0, 10.0 * uDpr);
  } else if (kind == ${DUST}) {
    bright *= arm;
    gl_PointSize = size * persp * uDpr * scale;
    color = vec3(0.03, 0.02, 0.05);
  } else if (kind == ${NEBULA}) {
    bright *= arm * arm * boost;
    gl_PointSize = size * persp * uDpr * scale;
    color = uNebColor;
  } else if (kind == ${CORE}) {
    bright = aLook.z * uCoreGlow;
    gl_PointSize = size * persp * uDpr * scale;
    color = uCoreColor;
  } else {
    float k = clamp(age / 2.5, 0.0, 1.0);
    bright = age > 0.0 && uClick.w == 1.0 ? (1.0 - k) * (1.0 - k) * uClickStrength : 0.0;
    gl_PointSize = (40.0 + 260.0 * sqrt(k)) * uDpr * scale;
    color = mix(vec3(1.0), uPal2, 0.4);
  }

  vColor = color;
  vAlpha = bright * uFade;
}`

const POINT_FS = `#version 300 es
precision highp float;
uniform float uSprite; // 0 glow, 1 dot, 2 square
in vec3 vColor;
in float vAlpha;
flat in int vKind;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord * 2.0 - 1.0;
  float d2 = dot(c, c);
  float g;
  if (vKind == ${STAR} || vKind == ${BG}) {
    if (uSprite == 2.0) g = 1.0;
    else if (d2 > 1.0) discard;
    else if (uSprite == 1.0) g = 1.0 - smoothstep(0.45, 1.0, sqrt(d2));
    else g = exp(-d2 * 5.0) + 0.25 * exp(-d2 * 1.6);
  } else {
    if (d2 > 1.0) discard;
    g = exp(-d2 * 3.2) * (1.0 - d2);
  }
  float a = clamp(vAlpha * g, 0.0, 1.0);
  outColor = vec4(vColor * a, a); // premultiplied
}`

// Orbit guide lines with pulses traveling at the stars' speed
const LINE_VS = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aLine; // radius, angle along the orbit
${COMMON}
uniform float uLineAlpha, uFade, uColorBy;
out vec3 vColor;
out float vAlpha;

void main() {
  float a = aLine.x;
  float arm;
  vec2 p = orbit(a, aLine.y, 0.0, arm);
  float persp;
  gl_Position = toClip(project(vec3(p.x, 0.0, p.y), persp));
  float travel = orbitPhase(a, 0.0);
  float pulse = pow(0.5 + 0.5 * cos(3.0 * (aLine.y - travel)), 16.0);
  vColor = palette(uColorBy == 2.0 ? arm : a / 1.1);
  vAlpha = uLineAlpha * (0.18 + 0.82 * pulse) * (0.45 + 0.55 * arm) * uFade;
}`

const LINE_FS = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 outColor;
void main() { outColor = vec4(vColor * vAlpha, vAlpha); }`

// Full-screen nebula behind the galaxy. With trails on it is drawn see-through,
// so the previous frames fade out instead of being wiped.
const SKY_VS = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`

const SKY_FS = `#version 300 es
precision highp float;
uniform vec2 uCenterPx, uParallax;
uniform float uScalePx, uTime, uLight, uFade, uSky, uAlpha;
uniform vec3 uSky0, uSky1;
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
  vec2 q = uv * 1.1 + uParallax * 0.0015;
  float n1 = fbm(q + vec2(uTime * 0.012, 0.0));
  float n2 = fbm(q * 1.7 - vec2(0.0, uTime * 0.009) + 5.0);
  float glow = exp(-dot(uv, uv) * 1.4);

  vec3 dark = vec3(0.006, 0.018, 0.02)
    + uSky0 * pow(n1, 3.0) * 0.55 * uSky
    + uSky1 * pow(n2, 4.0) * 0.45 * uSky
    + mix(uSky0, uSky1, 0.3) * glow * 0.6 * uSky;
  vec3 light = vec3(0.933, 0.973, 0.965)
    - (vec3(1.0) - uSky0) * 0.12 * pow(n1, 3.0) * uSky
    - (vec3(1.0) - uSky1) * 0.1 * pow(n2, 4.0) * uSky
    - vec3(0.06, 0.08, 0.0) * glow * 0.5 * uSky;
  vec3 base = mix(vec3(0.01, 0.03, 0.035), vec3(0.933, 0.973, 0.965), uLight);
  outColor = vec4(mix(base, mix(dark, light, uLight), uFade) * uAlpha, uAlpha);
}`

// Stretches the low-resolution sky texture over the screen, with a little
// dither so the smooth gradients don't band. Trails make it see-through.
const BLIT_FS = `#version 300 es
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uViewportPx;
uniform float uAlpha;
out vec4 outColor;
void main() {
  vec3 c = texture(uTex, gl_FragCoord.xy / uViewportPx).rgb;
  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
  outColor = vec4(c * uAlpha, uAlpha);
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

// Background stars, disk stars, dust, nebulae, the core glow and the supernova flash
function buildParticles(p: GalaxyParams) {
  const counts = {
    bg: Math.round(p.bgStars),
    star: Math.round(p.stars),
    dust: Math.round(p.stars * 0.03 * p.dust),
    nebula: Math.round(p.stars * 0.005 * p.nebulae),
  }
  const total = counts.bg + counts.star + counts.dust + counts.nebula + 2
  const orbit = new Float32Array(total * 4)
  const look = new Float32Array(total * 4)
  let i = 0
  const push = (o: number[], l: number[]) => { orbit.set(o, i * 4); look.set(l, i * 4); i++ }
  // Disk radius with an exponential falloff, or a small round bulge
  const disk = () => -0.26 * Math.log(1 - Math.random() * (1 - Math.exp(-4.2)))
  const radius = () => Math.random() < p.bulge ? Math.abs(gauss()) * 0.05 : disk()
  const outside = (min: number) => { let a = disk(); while (a < min) a = disk(); return a }

  for (let n = 0; n < counts.bg; n++) {
    push([Math.random(), Math.random(), Math.random(), 0], [rand(0.6, 1.9), Math.random(), rand(0.25, 0.8), BG])
  }
  for (let n = 0; n < counts.star; n++) {
    const a = radius()
    const bulge = Math.exp(-a / 0.09)
    const z = gauss() * (p.thickness + 0.05 * bulge)
    const temp = bulge > 0.4 ? rand(0.1, 0.5) : Math.pow(Math.random(), 0.65)
    const size = 1.3 + Math.pow(Math.random(), 7) * 2.6
    push([a, rand(0, Math.PI * 2), z, 0], [size, temp, rand(0.35, 1) * (1 - bulge * 0.35), STAR])
  }
  for (let n = 0; n < counts.dust; n++) {
    push([outside(0.25), rand(0, Math.PI * 2), gauss() * p.thickness * 0.5, 0.35], [rand(22, 48), 0.5, 0.12, DUST])
  }
  for (let n = 0; n < counts.nebula; n++) {
    push([outside(0.15), rand(0, Math.PI * 2), gauss() * p.thickness * 0.7, 0], [rand(12, 32), 0.5, rand(0.2, 0.5), NEBULA])
  }
  push([0, 0, 0, 0], [90, 0.5, 0.45, CORE])
  push([0, 0, 0, 0], [1, 0.5, 1, NOVA])

  const starsEnd = counts.bg + counts.star
  return { orbit, look, ranges: {
    additive: [0, starsEnd] as const,
    dust: [starsEnd, counts.dust] as const,
    glow: [starsEnd + counts.dust, counts.nebula + 2] as const,
  } }
}

// Orbit guide lines: one oval per radius, as line segments
function buildLines(count: number) {
  const segments = 160
  const data = new Float32Array(count * segments * 4)
  let i = 0
  for (let k = 0; k < count; k++) {
    const a = 0.08 + (k / Math.max(count - 1, 1)) * 0.95
    for (let s = 0; s < segments; s++) {
      const t0 = (s / segments) * Math.PI * 2, t1 = ((s + 1) / segments) * Math.PI * 2
      data.set([a, t0, a, t1], i)
      i += 4
    }
  }
  return data
}

const REBUILD: (keyof GalaxyParams)[] = ["stars", "bgStars", "nebulae", "dust", "bulge", "thickness"]

type GalaxyGLOptions = {
  center?: (w: number, h: number) => [number, number]
  radius?: (w: number, h: number) => number
  params?: Partial<GalaxyParams>
  preserveBuffer?: boolean
}

// Returns null when WebGL2 is not available, so the caller can fall back to the 2D version
export function createGalaxyGL(canvas: HTMLCanvasElement, opts: GalaxyGLOptions = {}) {
  const params: GalaxyParams = { ...defaultParams, ...opts.params }
  // Only trails need the previous frame; keeping the buffer otherwise costs a copy per frame on phones
  const preserveDrawingBuffer = opts.preserveBuffer ?? params.trails > 0
  const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true, alpha: false, preserveDrawingBuffer })
  if (!gl) return null

  let points: WebGLProgram, lines: WebGLProgram, sky: WebGLProgram, blit: WebGLProgram
  try {
    points = compile(gl, POINT_VS, POINT_FS)
    lines = compile(gl, LINE_VS, LINE_FS)
    sky = compile(gl, SKY_VS, SKY_FS)
    blit = compile(gl, SKY_VS, BLIT_FS)
  } catch (error) {
    console.warn("Galaxy shaders failed, using the 2D version", error)
    return null
  }

  const vao = gl.createVertexArray()
  const orbitBuffer = gl.createBuffer(), lookBuffer = gl.createBuffer()
  gl.bindVertexArray(vao)
  for (const [location, buffer] of [[0, orbitBuffer], [1, lookBuffer]] as const) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 4, gl.FLOAT, false, 0, 0)
  }
  let ranges = buildParticlesInto()

  function buildParticlesInto() {
    const built = buildParticles(params)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, orbitBuffer)
    gl!.bufferData(gl!.ARRAY_BUFFER, built.orbit, gl!.STATIC_DRAW)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, lookBuffer)
    gl!.bufferData(gl!.ARRAY_BUFFER, built.look, gl!.STATIC_DRAW)
    return built.ranges
  }

  const lineVao = gl.createVertexArray()
  const lineBuffer = gl.createBuffer()
  gl.bindVertexArray(lineVao)
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  let lineVertices = 0
  let lineCount = -1
  function buildLinesInto() {
    const data = buildLines(Math.round(params.orbitLineCount))
    gl!.bindBuffer(gl!.ARRAY_BUFFER, lineBuffer)
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW)
    lineVertices = data.length / 2
    lineCount = params.orbitLineCount
  }

  const skyVao = gl.createVertexArray()

  const uniforms = (program: WebGLProgram) => {
    const cache = new Map<string, WebGLUniformLocation | null>()
    return (name: string) => {
      if (!cache.has(name)) cache.set(name, gl!.getUniformLocation(program, name))
      return cache.get(name)!
    }
  }
  const up = uniforms(points), ul = uniforms(lines), us = uniforms(sky), ub = uniforms(blit)

  // The sky is smooth noise, so it is drawn into a texture at a third of the
  // CSS resolution and stretched: most of the GPU work saved on phones
  const SKY_SCALE = 1 / 3
  const skyTex = gl.createTexture()
  const skyFbo = gl.createFramebuffer()
  let skyW = 1, skyH = 1
  function sizeSky() {
    skyW = Math.max(1, Math.round(w * SKY_SCALE))
    skyH = Math.max(1, Math.round(h * SKY_SCALE))
    gl!.bindTexture(gl!.TEXTURE_2D, skyTex)
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, skyW, skyH, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE)
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE)
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, skyFbo)
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, skyTex, 0)
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
  }

  let w = 0, h = 0, dpr = 1
  let light = 0, lightTarget = 0
  let scroll = 0
  let lost = false
  let start = -1
  // Steps down on slow devices: 1 drops to 1x resolution, 2 and 3 draw fewer stars
  let quality = 0
  const starShare = () => [1, 1, 0.6, 0.35][quality]
  const click = { x: 0, z: 0, t: -100, mode: 0 }
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, px: -1e4, py: -1e4 }
  const frames: number[] = []
  let lastFrame = 0

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); lost = true })

  function layout() {
    const [cx, cy] = opts.center ? opts.center(w, h) : [w / 2, h / 2]
    const r = opts.radius ? opts.radius(w, h) : Math.min(w, h) * 0.45
    return { cx: cx + params.offsetX * w, cy: cy + params.offsetY * h, scale: r * params.scale }
  }

  // Camera for a given moment: intro fly-in, pointer, auto spin and scroll
  function camera(t: number) {
    const intro = params.intro ? easeOut((t - start) / 3.2) : 1
    const look = params.parallax
    let yaw = params.yaw + (ptr.x - 0.5) * 0.7 * look + (1 - intro) * 1.4 + (t - Math.max(start, 0)) * params.autoSpin
    let pitch = params.tilt + (ptr.y - 0.5) * 0.35 * look + (1 - intro) * 0.42
    let dist = params.distance + (1 - intro) * 5
    let zoom = 1
    let fade = intro
    if (params.scrollMode === "tilt") { pitch -= scroll * 0.55; dist += scroll * 1.2; fade *= 1 - scroll * 0.6 }
    if (params.scrollMode === "dive") { zoom = 1 + scroll * 1.6; pitch += scroll * 0.3; fade *= 1 - scroll * 0.4 }
    if (params.scrollMode === "spin") { yaw += scroll * 2.5; fade *= 1 - scroll * 0.4 }
    return { yaw, pitch, dist, zoom, fade }
  }

  // Screen point to a point in the galaxy plane, for click effects
  function toPlane(x: number, y: number, t: number) {
    const cam = camera(t)
    const { cx, cy, scale } = layout()
    // Undo the roll, then cast a ray from the camera (0, 0, dist) through (sx, sy, 0)
    const rx = (x - cx) / (scale * cam.zoom), ry = (y - cy) / (scale * cam.zoom)
    const cr = Math.cos(-params.roll), sr = Math.sin(-params.roll)
    const sx = rx * cr - ry * sr, sy = -(rx * sr + ry * cr)
    const unpitch = (v: number[]) => [v[0], v[1] * Math.cos(-cam.pitch) - v[2] * Math.sin(-cam.pitch), v[1] * Math.sin(-cam.pitch) + v[2] * Math.cos(-cam.pitch)]
    const unyaw = (v: number[]) => {
      const c = Math.cos(-cam.yaw), s = Math.sin(-cam.yaw)
      return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c]
    }
    const O = unyaw(unpitch([0, 0, cam.dist])), D = unyaw(unpitch([sx, sy, -cam.dist]))
    if (Math.abs(D[1]) < 1e-5) return null
    const k = -O[1] / D[1]
    if (k < 0) return null
    return { x: O[0] + D[0] * k, z: O[2] + D[2] * k }
  }

  function setPalette(set: (name: string) => WebGLUniformLocation | null) {
    const pal = palettes[params.palette]
    const pick = (c: Rgb) => light > 0.5 ? ink(c) : c
    gl!.uniform3fv(set("uPal0"), pick(pal.stops[0]))
    gl!.uniform3fv(set("uPal1"), pick(pal.stops[1]))
    gl!.uniform3fv(set("uPal2"), pick(pal.stops[2]))
    return { core: pick(pal.core), nebula: pick(pal.nebula) }
  }

  function setCommon(set: (name: string) => WebGLUniformLocation | null, t: number, cam: ReturnType<typeof camera>, cx: number, cy: number, scale: number) {
    gl!.uniform1f(set("uTime"), t)
    gl!.uniform1f(set("uArms"), Math.round(params.arms))
    gl!.uniform1f(set("uTwist"), params.twist)
    gl!.uniform1f(set("uLobe"), params.lobe)
    gl!.uniform1f(set("uSpeed"), params.speed)
    gl!.uniform1f(set("uYaw"), cam.yaw)
    gl!.uniform1f(set("uPitch"), cam.pitch)
    gl!.uniform1f(set("uRoll"), params.roll)
    gl!.uniform1f(set("uDist"), cam.dist)
    gl!.uniform1f(set("uScale"), scale)
    gl!.uniform2f(set("uCenter"), cx, cy)
    gl!.uniform2f(set("uViewport"), w, h)
    gl!.uniform1f(set("uFade"), cam.fade)
    gl!.uniform1f(set("uColorBy"), ["temperature", "radius", "arm"].indexOf(params.colorBy))
  }

  return {
    get lost() { return lost },
    getParams: () => ({ ...params }),
    setParams(next: Partial<GalaxyParams>) {
      const rebuild = REBUILD.some((key) => key in next && next[key] !== params[key])
      Object.assign(params, next)
      if (rebuild) ranges = buildParticlesInto()
    },
    // Up to 2x pixel density on large screens, 1.5x on phones, 1x once quality drops
    resize(width: number, height: number, ratio = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.5 : 2)) {
      w = width; h = height; dpr = quality >= 1 ? 1 : ratio
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      sizeSky()
    },
    setTheme(dark: boolean) { lightTarget = dark ? 0 : 1 },
    setScroll(progress: number) { scroll = clamp(progress, 0, 1) },
    pointer(x: number, y: number) { ptr.tx = x / w; ptr.ty = y / h; ptr.px = x; ptr.py = y },
    leave() { ptr.tx = 0.5; ptr.ty = 0.5; ptr.px = -1e4; ptr.py = -1e4 },
    supernova(x: number, y: number) {
      if (params.clickMode === "none") return
      const t = performance.now() / 1000
      const hit = toPlane(x, y, t)
      if (hit && Math.hypot(hit.x, hit.z) < 1.4) Object.assign(click, { ...hit, t, mode: params.clickMode === "supernova" ? 1 : 2 })
    },
    draw(ms: number) {
      if (lost || !w || !h) return
      const t = ms / 1000
      if (start < 0) start = t
      ptr.x += (ptr.tx - ptr.x) * 0.04
      ptr.y += (ptr.ty - ptr.y) * 0.04
      light += (lightTarget - light) * 0.12
      if (Math.abs(lightTarget - light) < 0.01) light = lightTarget

      // Lighter load on slow devices: once the intro is over, check every 60
      // frames and step down one quality level while the median frame is slow
      if (lastFrame) frames.push(ms - lastFrame)
      lastFrame = ms
      if (frames.length >= 60) {
        const median = [...frames].sort((a, b) => a - b)[30]
        frames.length = 0
        if (t - start > 2 && median > 21 && quality < 3) {
          quality++
          if (quality === 1 && dpr > 1) this.resize(w, h)
        }
      }

      const cam = camera(t)
      const base = layout()
      const scale = base.scale * cam.zoom
      const { cx, cy } = base
      const parallaxX = (ptr.x - 0.5) * -24 * params.parallax, parallaxY = (ptr.y - 0.5) * -24 * params.parallax
      const over = () => gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
      const glow = () => light > 0.5 ? over() : gl!.blendFunc(gl!.ONE, gl!.ONE)

      gl!.disable(gl!.DEPTH_TEST)

      // Sky at low resolution into its texture...
      const k = skyW / w
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, skyFbo)
      gl!.viewport(0, 0, skyW, skyH)
      gl!.disable(gl!.BLEND)
      gl!.useProgram(sky)
      gl!.bindVertexArray(skyVao)
      gl!.uniform3fv(us("uSky0"), palettes[params.palette].sky[0])
      gl!.uniform3fv(us("uSky1"), palettes[params.palette].sky[1])
      gl!.uniform2f(us("uCenterPx"), cx * k, (h - cy) * k)
      gl!.uniform2f(us("uParallax"), parallaxX, parallaxY)
      gl!.uniform1f(us("uScalePx"), scale * k)
      gl!.uniform1f(us("uTime"), t)
      gl!.uniform1f(us("uLight"), light)
      gl!.uniform1f(us("uFade"), cam.fade)
      gl!.uniform1f(us("uSky"), params.sky)
      gl!.uniform1f(us("uAlpha"), 1)
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)

      // ...then stretched over the screen, opaque or see-through for trails
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
      gl!.viewport(0, 0, canvas.width, canvas.height)
      gl!.useProgram(blit)
      gl!.activeTexture(gl!.TEXTURE0)
      gl!.bindTexture(gl!.TEXTURE_2D, skyTex)
      gl!.uniform1i(ub("uTex"), 0)
      gl!.uniform2f(ub("uViewportPx"), canvas.width, canvas.height)
      gl!.uniform1f(ub("uAlpha"), 1 - clamp(params.trails, 0, 0.97))
      gl!.enable(gl!.BLEND)
      over()
      gl!.drawArrays(gl!.TRIANGLES, 0, 3)

      // Orbit guide lines
      if (params.orbitLines > 0) {
        if (lineCount !== params.orbitLineCount) buildLinesInto()
        gl!.useProgram(lines)
        gl!.bindVertexArray(lineVao)
        setCommon(ul, t, cam, cx, cy, scale)
        setPalette(ul)
        gl!.uniform1f(ul("uLineAlpha"), params.orbitLines)
        glow()
        gl!.drawArrays(gl!.LINES, 0, lineVertices)
      }

      // Stars, dust, nebulae
      gl!.useProgram(points)
      gl!.bindVertexArray(vao)
      setCommon(up, t, cam, cx, cy, scale)
      const colors = setPalette(up)
      gl!.uniform3fv(up("uCoreColor"), colors.core)
      gl!.uniform3fv(up("uNebColor"), colors.nebula)
      gl!.uniform1f(up("uDpr"), dpr)
      gl!.uniform1f(up("uLight"), light)
      gl!.uniform1f(up("uArmContrast"), params.armContrast)
      gl!.uniform1f(up("uInnerDim"), params.innerDim)
      gl!.uniform1f(up("uCoreGlow"), params.coreGlow)
      gl!.uniform1f(up("uStarSize"), params.starSize)
      gl!.uniform1f(up("uBrightness"), params.brightness)
      gl!.uniform1f(up("uTwinkle"), params.twinkle)
      gl!.uniform1f(up("uSprite"), ["glow", "dot", "square"].indexOf(params.sprite))
      gl!.uniform1f(up("uPointerMode"), ["none", "flashlight", "gravity", "repel"].indexOf(params.pointerMode))
      gl!.uniform1f(up("uPointerRadius"), params.pointerRadius)
      gl!.uniform1f(up("uPointerStrength"), params.pointerStrength)
      gl!.uniform1f(up("uClickStrength"), params.clickStrength)
      gl!.uniform2f(up("uMouse"), ptr.px, ptr.py)
      gl!.uniform2f(up("uParallax"), parallaxX, parallaxY)
      gl!.uniform4f(up("uClick"), click.x, click.z, click.t, click.mode)

      glow()
      gl!.drawArrays(gl!.POINTS, ranges.additive[0], Math.round(ranges.additive[1] * starShare()))
      if (light < 0.5 && ranges.dust[1] > 0) {
        over()
        gl!.drawArrays(gl!.POINTS, ranges.dust[0], ranges.dust[1])
      }
      glow()
      gl!.drawArrays(gl!.POINTS, ranges.glow[0], ranges.glow[1])
    },
  }
}
