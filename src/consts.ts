import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Rolando's Portfolio",
  DESCRIPTION: "Welcome to my Personal Portfolio.",
  AUTHOR: "Rolando García Ramos",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Work", 
    HREF: "/work", 
  },
  { 
    TEXT: "Blog", 
    HREF: "/blog", 
  },
  { 
    TEXT: "Projects", 
    HREF: "/projects", 
  },
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
    HREF: "https://github.com/RolandoGR/astrosphere"
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

