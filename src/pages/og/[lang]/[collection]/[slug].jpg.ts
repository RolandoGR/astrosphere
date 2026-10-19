// Social preview image for each post and project, rendered at build time:
// the title and summary laid out with Satori over the galaxy background.
import fs from "node:fs/promises"
import path from "node:path"
import type { APIRoute } from "astro"
import type { CollectionEntry } from "astro:content"
import satori from "satori"
import sharp from "sharp"
import { getLocalized, entrySlug, langs, useTranslations, type Lang } from "@i18n/index"
import { formatDate } from "@lib/utils"

type Entry = CollectionEntry<"blog"> | CollectionEntry<"projects">

export async function getStaticPaths() {
  const paths = []
  for (const lang of langs) {
    for (const collection of ["blog", "projects"] as const) {
      for (const entry of await getLocalized(collection, lang)) {
        paths.push({ params: { lang, collection, slug: entrySlug(entry) }, props: { entry, lang } })
      }
    }
  }
  return paths
}

const root = process.cwd()
const read = (file: string) => fs.readFile(path.join(root, file))
const fontFile = (weight: number) => `node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-${weight}-normal.woff`

// Loaded once per build
const assets = (async () => {
  const [background, logo, regular, medium, bold] = await Promise.all([
    read("src/assets/og-galaxy.jpg"),
    read("public/favicon.svg"),
    read(fontFile(400)),
    read(fontFile(500)),
    read(fontFile(700)),
  ])
  // The favicon switches colors with the theme; on the dark image it uses the dark-theme ones
  const whiteLogo = logo.toString()
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replaceAll('class="r"', 'stroke="#ffffff"')
    .replaceAll('class="g"', 'stroke="#2dd4bf"')
  // Rasterized, since an SVG nested inside Satori's SVG does not render
  const logoPng = await sharp(Buffer.from(whiteLogo)).resize(96, 96).png().toBuffer()
  return {
    background: `data:image/jpeg;base64,${background.toString("base64")}`,
    logo: `data:image/png;base64,${logoPng.toString("base64")}`,
    fonts: [
      { name: "Space Grotesk", data: regular, weight: 400 as const },
      { name: "Space Grotesk", data: medium, weight: 500 as const },
      { name: "Space Grotesk", data: bold, weight: 700 as const },
    ],
  }
})()

const clip = (text: string, max: number) => text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, "")}…`

const el = (type: string, style: object, children?: unknown, extra: object = {}) =>
  ({ type, props: { style, children, ...extra } })

export const GET: APIRoute = async ({ props }) => {
  const { entry, lang } = props as { entry: Entry; lang: Lang }
  const t = useTranslations(lang)
  const { background, logo, fonts } = await assets
  const title = entry.data.title
  const titleSize = title.length > 60 ? 52 : title.length > 36 ? 62 : 74

  const svg = await satori(
    el("div", { width: 1200, height: 630, display: "flex", backgroundColor: "#05040f", backgroundImage: `url(${background})`, backgroundSize: "1200px 630px", fontFamily: "Space Grotesk", color: "#ffffff" }, [
      el("div", { display: "flex", flexDirection: "column", justifyContent: "center", width: 760, height: "100%", padding: "0 72px" }, [
        el("div", { display: "flex", alignItems: "center" }, [
          el("img", { width: 48, height: 48, marginRight: 16 }, undefined, { src: logo, width: 48, height: 48 }),
          el("div", { fontSize: 22, fontWeight: 500, letterSpacing: 6, color: "#a5b4fc" },
            `ROLANDO.GR · ${t(entry.collection === "blog" ? "og.blog" : "og.projects").toUpperCase()}`),
        ]),
        el("div", { fontSize: titleSize, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1, marginTop: 30 }, title),
        el("div", { fontSize: 26, lineHeight: 1.35, color: "#cbd5e1", marginTop: 24 }, clip(entry.data.summary, 150)),
        el("div", { fontSize: 20, color: "rgba(255,255,255,.55)", marginTop: 36 },
          `Rolando García Ramos · ${formatDate(entry.data.date, lang)}`),
      ]),
    ]) as Parameters<typeof satori>[0],
    { width: 1200, height: 630, fonts },
  )

  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer()
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg" } })
}
