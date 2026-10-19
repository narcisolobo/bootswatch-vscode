# Bootswatch for VS Code: docs site

A static [Astro](https://astro.build) site for the theme suite. It reads the theme files in `../themes/` and `../package.json` at build time, so the previews always match what the extension ships.

## Develop

```sh
npm install
npm run dev     # local dev server
npm test        # unit tests; build first (npm run build) for the build-output tests
npm run build   # static site into dist/
```

Requires Node 22.22 or newer (Astro 7).

## One-time GitHub setup

1. Create the GitHub repo.
2. Set `owner` and `repo` in `site.config.mjs`. They set the Pages base path and every GitHub link.3. In the repo, go to Settings, then Pages, and set Source to "GitHub Actions".
4. Push to `main`. `.github/workflows/pages.yml` builds and deploys the site.

When the extension is on the Marketplace, set `marketplaceUrl` in `site.config.mjs`. The "Install for VS Code" button and the footer link switch to it.

## Updating the themes

Regenerate the themes (`python3 gen_themes.py --suite`), commit, and push. The workflow rebuilds the site from the new theme files.
