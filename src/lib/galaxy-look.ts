// The galaxy's look on the site, chosen in the galaxy lab: the "Data orbits"
// preset (orbit lines with traveling pulses, square particles colored by
// radius) at an inclined, diagonal angle, with a gentler pointer. Its
// palette follows the teal brand.
import type { GalaxyParams } from "@lib/galaxy-gl"

export const siteGalaxy: Partial<GalaxyParams> = {
  arms: 2, twist: 4.8, lobe: 0.32, armContrast: 1.2, thickness: 0.012, bulge: 0.12, coreGlow: 0.4, innerDim: 0.9,
  palette: "teal", colorBy: "radius", sprite: "square", starSize: 0.8, brightness: 1, twinkle: 0,
  nebulae: 0, dust: 0, sky: 0.4, bgStars: 2400,
  speed: 1.5, trails: 0, orbitLines: 0.55, orbitLineCount: 28,
  tilt: 0.6, roll: -0.3, yaw: 0.1, distance: 3.2, autoSpin: 0, parallax: 0.25, scrollMode: "tilt",
  pointerMode: "repel", pointerRadius: 75, pointerStrength: 0.65,
  clickMode: "ripple", clickStrength: 1,
}
