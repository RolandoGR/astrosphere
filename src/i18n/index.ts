// Server-side language helpers (they read content collections)
import { getCollection, type CollectionEntry } from "astro:content"
import { languages, type Lang } from "./ui"
import { entryLang, entrySlug } from "./paths"

export * from "./ui"
export * from "./paths"

type Localized = "blog" | "projects" | "work" | "legal"

export const langs = Object.keys(languages) as Lang[]

// Published entries of one language, newest first
export async function getLocalized<C extends Localized>(collection: C, lang: Lang) {
  const entries = await getCollection(collection, (entry) =>
    entryLang(entry) === lang && !("draft" in entry.data && entry.data.draft))
  return entries.sort((a, b) => dateOf(b) - dateOf(a)) as CollectionEntry<C>[]
}

function dateOf(entry: { data: object }) {
  const data = entry.data as { date?: Date; dateStart?: Date }
  return (data.date ?? data.dateStart)?.getTime() ?? 0
}

// getStaticPaths for the entry pages of one language
export async function entryPaths<C extends Localized>(collection: C, lang: Lang) {
  const entries = await getLocalized(collection, lang)
  return entries.map((entry) => ({ params: { slug: entrySlug(entry) }, props: { entry } }))
}
