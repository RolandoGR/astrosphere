import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useTranslations, type Lang } from "@i18n/ui"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const locales: Record<Lang, string> = { en: "en-US", es: "es-MX" }

export function formatDate(date: Date, lang: Lang = "en") {
  return Intl.DateTimeFormat(locales[lang], {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date)
}

export function readingTime(html: string, lang: Lang = "en") {
  const textOnly = html.replace(/<[^>]+>/g, "")
  const wordCount = textOnly.split(/\s+/).length
  const readingTimeMinutes = ((wordCount / 200) + 1).toFixed()
  return useTranslations(lang)("entry.minutes", { n: readingTimeMinutes })
}

// Drop the raw and rendered content from an entry before passing it to a
// client component, so it isn't serialized into the page
export function withoutContent<T extends { body?: string; rendered?: unknown }>(entry: T): T {
  const copy = { ...entry }
  delete copy.body
  delete copy.rendered
  return copy
}
