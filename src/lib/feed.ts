import rss from "@astrojs/rss"
import { SITE } from "@consts"
import { entryUrl, getLocalized, useTranslations, type Lang } from "@i18n/index"

// RSS feed of the posts and projects in one language
export async function feed(site: URL, lang: Lang) {
  const t = useTranslations(lang)
  const items = [...await getLocalized("blog", lang), ...await getLocalized("projects", lang)]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

  return rss({
    title: SITE.TITLE,
    description: t("site.description"),
    site,
    items: items.map((item) => ({
      title: item.data.title,
      description: item.data.summary,
      pubDate: item.data.date,
      link: entryUrl(item),
    })),
    customData: `<language>${lang === "es" ? "es-mx" : "en-us"}</language>`,
  })
}
