// schema.org JSON-LD for search engines
import type { CollectionEntry } from "astro:content"
import { SITE, SOCIALS } from "@consts"
import { entryLang, entryUrl, localizePath } from "@i18n/paths"
import type { Lang } from "@i18n/ui"

const languageTags: Record<Lang, string> = { en: "en-US", es: "es-MX" }

export function person(site: URL) {
  return {
    "@type": "Person",
    "@id": new URL("/#person", site).href,
    name: SITE.AUTHOR,
    url: site.href,
    jobTitle: SITE.JOB_TITLE,
    image: new URL("/apple-touch-icon.png", site).href,
    address: { "@type": "PostalAddress", addressLocality: SITE.LOCALITY, addressCountry: SITE.COUNTRY },
    sameAs: SOCIALS.filter((s) => s.HREF.startsWith("http")).map((s) => s.HREF),
  }
}

export function homePage(site: URL, lang: Lang, description: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      person(site),
      {
        "@type": "WebSite",
        "@id": new URL("/#website", site).href,
        name: SITE.TITLE,
        url: new URL(localizePath("/", lang), site).href,
        description,
        inLanguage: languageTags[lang],
        author: { "@id": new URL("/#person", site).href },
      },
    ],
  }
}

export function entryPage(site: URL, entry: CollectionEntry<"blog"> | CollectionEntry<"projects">, image: string) {
  const url = new URL(entryUrl(entry), site).href
  return {
    "@context": "https://schema.org",
    "@type": entry.collection === "blog" ? "BlogPosting" : "CreativeWork",
    headline: entry.data.title,
    description: entry.data.summary,
    datePublished: entry.data.date.toISOString(),
    inLanguage: languageTags[entryLang(entry)],
    keywords: entry.data.tags.join(", "),
    url,
    mainEntityOfPage: url,
    image: new URL(image, site).href,
    author: person(site),
  }
}
