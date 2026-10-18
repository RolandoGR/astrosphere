# astrosphere

Personal portfolio and blog of Rolando García Ramos, live at [rolando.gr](https://rolando.gr).

Built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com) and [SolidJS](https://www.solidjs.com), based on the [Astro Sphere](https://github.com/markhorn-dev/astro-sphere) template.

## Development

Requires Node.js 20+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # type-check + static build into dist/
pnpm preview    # serve the built site
```

## Content

All content lives in `src/content/` as Markdown, in English and Spanish. Each entry has an English file and a Spanish one next to it (`index.md` and `index.es.md`, or `kino.md` and `kino.es.md`), sharing the same images. English pages are served at the root and Spanish ones under `/es/`; the folder name is the URL slug in both languages.

| Folder      | What it is                                  |
| ----------- | ------------------------------------------- |
| `blog/`     | Blog posts (one folder per post + images)   |
| `projects/` | Project pages (`demoUrl`/`repoUrl` optional) |
| `work/`     | Work history entries                        |
| `legal/`    | Terms and privacy pages                     |

Set `draft: true` in a post or project's frontmatter to hide it from the site and RSS feed.
Interface text for both languages is in `src/i18n/ui.ts`; navigation and social links are in `src/consts.ts`. Each post and project gets a social preview image generated at build time (`src/pages/og/`).

## Deployment

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`. Pull requests are type-checked and built by `.github/workflows/check.yml`, and Dependabot opens weekly dependency updates. The custom domain is set in `public/CNAME`.
