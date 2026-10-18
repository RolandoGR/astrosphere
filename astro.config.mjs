import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import solidJs from "@astrojs/solid-js"

// https://astro.build/config
export default defineConfig({
  site: "https://rolando.gr",
  integrations: [
    mdx(),
    sitemap({ i18n: { defaultLocale: "en", locales: { en: "en-US", es: "es-MX" } } }),
    solidJs(),
    tailwind({ applyBaseStyles: false }),
  ],
  // English at the root, Spanish under /es/
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: { prefixDefaultLocale: false },
  },
  // Old blog URLs, kept working after the posts got descriptive slugs
  redirects: {
    "/blog/01-transformando-negocio-de-medicina-estetica-i": "/blog/transforming-an-aesthetic-medicine-business-part-1",
    "/blog/2025-06-12": "/blog/patitas-unidas-the-beginning",
    "/blog/2025-06-13": "/blog/patitas-unidas-technical-foundations",
    "/blog/2025-06-14": "/blog/patitas-unidas-impact-and-next-steps",
  },
})
