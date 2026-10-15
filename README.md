# gray-tupas-portfolio

My portfolio: **https://gray-tupas-portfolio.vercel.app**

I'm Gray-Jan Tupas, an AI Automation & Operations Specialist. The site is an "automation canvas": n8n workflows, AI-assisted operational systems, my AI workspace, and a client website I built with an AI coding agent. Client names are left out on purpose.

## n8n workflows

The exported workflows behind the builds, with screenshots and write-ups, are in [`automations/`](automations/). Credentials, IDs, emails and client names have been removed.

## How it's built

- Plain HTML, CSS and a little JavaScript. No framework, no build step.
- `index.html` is the home page. Case studies live in `work/`.
- `styles.css` is shared by every page. `site.js` runs the home page: scroll reveals, the build filters and the screenshot viewer.
- Fonts are self-hosted (Inter, Source Serif 4, JetBrains Mono). The site makes no third-party requests and has no tracking.
- The leaves, vines and stream are inline SVG. All motion is CSS and switches off for visitors who prefer reduced motion.
- Built with Claude Code as my coding agent, working from a rules file and a decision log, with a review and a commit at each stage.
- Hosted on Vercel. `vercel.json` adds trailing slashes so the case-study links resolve.

## Checks

- Lighthouse (mobile, measured locally): home 94 / 100 / 100 / 100, case studies 99 / 100 / 100 / 100 (Performance / Accessibility / Best Practices / SEO).
- WCAG AA contrast on every text colour pair, 44px touch targets, a skip link, and a screenshot viewer that works by keyboard.

## Run it locally

Any static file server works, for example:

```
npx serve .
```

## Rights

The code is here to read. My photo, the screenshots and the written content are mine and are not licensed for reuse.
