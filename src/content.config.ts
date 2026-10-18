import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

// Every collection has an English file and a Spanish one next to it
// ("index.md" / "index.es.md", "kino.md" / "kino.es.md"), so both share images.
// Entry ids are "<lang>/<slug>", e.g. "es/patitas-unidas-the-beginning".
function localized(base: string) {
  return glob({
    pattern: "**/*.{md,mdx}",
    base,
    generateId: ({ entry }) => {
      const [, path, lang] = entry.match(/^(.*?)(?:\.(es))?\.mdx?$/)!
      return `${lang ?? "en"}/${path.replace(/\/index$/, "").toLowerCase()}`
    },
  })
}

const work = defineCollection({
  loader: localized("./src/content/work"),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.coerce.date(),
    dateEnd: z.union([z.coerce.date(), z.string()]),
  }),
})

const blog = defineCollection({
  loader: localized("./src/content/blog"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
  }),
})

const projects = defineCollection({
  loader: localized("./src/content/projects"),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    draft: z.boolean().optional(),
    demoUrl: z.string().optional(),
    repoUrl: z.string().optional(),
  }),
})

const legal = defineCollection({
  loader: localized("./src/content/legal"),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
})

export const collections = { work, blog, projects, legal }
