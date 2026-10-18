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

All content lives in `src/content/` as Markdown:

| Folder      | What it is                                  |
| ----------- | ------------------------------------------- |
| `blog/`     | Blog posts (one folder per post + images)   |
| `projects/` | Project pages (`demoUrl`/`repoUrl` optional) |
| `work/`     | Work history entries                        |
| `legal/`    | Terms and privacy pages                     |

Set `draft: true` in a post or project's frontmatter to hide it from the site and RSS feed.
Site-wide text, navigation and social links are in `src/consts.ts`.

## Deployment

Every push to `main` builds and deploys to GitHub Pages via `.github/workflows/deploy.yml`. The custom domain is set in `public/CNAME`.
