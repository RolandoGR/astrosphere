import type { UiKey } from "@i18n/ui"

export type Site = {
  TITLE: string
  AUTHOR: string
  JOB_TITLE: string
  LOCALITY: string
  COUNTRY: string
}

export type Links = {
  KEY: UiKey
  HREF: string
}[]

export type Socials = {
  NAME: string
  ICON: string
  TEXT: string
  HREF: string
}[]
