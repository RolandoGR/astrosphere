// URL helpers shared by server and client code: English lives at the root,
// Spanish under /es/. Content entry ids are "<lang>/<slug>" (see content.config.ts).
import { defaultLang, languages, type Lang } from "./ui"

export function langFromUrl(url: URL): Lang {
  const [first] = url.pathname.split("/").filter(Boolean)
  return first in languages ? (first as Lang) : defaultLang
}

// "/blog/x" -> "/es/blog/x" for Spanish, unchanged for English
export function localizePath(path: string, lang: Lang) {
  if (lang === defaultLang) return path
  return path === "/" ? `/${lang}/` : `/${lang}${path}`
}

// The current page without its language prefix: "/es/blog/x" -> "/blog/x"
export function barePath(url: URL) {
  const lang = langFromUrl(url)
  return lang === defaultLang ? url.pathname : url.pathname.slice(lang.length + 1) || "/"
}

// The same page in another language
export const switchLangPath = (url: URL, lang: Lang) => localizePath(barePath(url), lang)

export const entryLang = (entry: { id: string }) => entry.id.split("/")[0] as Lang
export const entrySlug = (entry: { id: string }) => entry.id.split("/").slice(1).join("/")
export const entryUrl = (entry: { id: string; collection: string }) =>
  localizePath(`/${entry.collection}/${entrySlug(entry)}`, entryLang(entry))

// Social preview image generated for each entry (src/pages/og/...)
export const entryImage = (entry: { id: string; collection: string }) =>
  `/og/${entryLang(entry)}/${entry.collection}/${entrySlug(entry)}.jpg`
