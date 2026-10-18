import type { Site, Links, Socials } from "@types"

// Global (page titles, descriptions and other text live in src/i18n/ui.ts)
export const SITE: Site = {
  TITLE: "Rolando García Ramos",
  AUTHOR: "Rolando García Ramos",
  JOB_TITLE: "Software and industrial engineer",
  LOCALITY: "Hermosillo, Sonora",
  COUNTRY: "MX",
}

// Header and drawer navigation (English paths; Spanish adds /es)
export const LINKS: Links = [
  { KEY: "nav.home", HREF: "/" },
  { KEY: "nav.work", HREF: "/work" },
  { KEY: "nav.blog", HREF: "/blog" },
  { KEY: "nav.projects", HREF: "/projects" },
]

// Socials
export const SOCIALS: Socials = [
  {
    NAME: "Email",
    ICON: "email",
    TEXT: "rolandogr.dev@gmail.com",
    HREF: "mailto:rolandogr.dev@gmail.com",
  },
  {
    NAME: "Github",
    ICON: "github",
    TEXT: "RolandoGR",
    HREF: "https://github.com/RolandoGR"
  },
  {
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "Rolando García Ramos",
    HREF: "https://www.linkedin.com/in/rolando-garcia-ramos-26a60665/",
  },
  {
    NAME: "Twitter",
    ICON: "twitter-x",
    TEXT: "RolandoGarcaR1",
    HREF: "https://x.com/RolandoGarcaR1",
  },
]
