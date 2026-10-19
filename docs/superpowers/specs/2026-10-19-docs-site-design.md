# Bootswatch for VS Code: docs site — design

Date: 2026-10-19

## Intent

A static site on GitHub Pages for the Bootswatch VS Code theme suite. It should
recreate the feeling of discovering bootswatch.com while learning CSS and
Bootstrap: the same markup, a completely different look, almost no effort.
The owner (a teacher) showed Bootswatch to students, who were "equally amazed at
how easy it was to give Bootstrap a different look." This site should give the
same moment for VS Code, and be something a teacher can put in front of a class.

The owner saw a throwaway mockup (navbar theme picker, page restyled with the
real Bootswatch CSS, a mock VS Code window coloured from the generated theme
files, ←/→ to flip themes) and said it "totally" captured the feeling. The
mockup lives at `.superpowers/brainstorm/*/content/theme-page.html` (git-ignored)
and its generator at the session scratchpad; it's a reference, not code to keep.

## Goals

- **Home: the wall.** Opens with a grid of all 26 themes, like bootswatch.com's
  homepage. Each card shows the theme name, Bootswatch's tagline, a small preview,
  and a link to that theme on the Themes page.
- **Themes: the switcher.** One page with a theme picker in the navbar and
  previous/next controls; ←/→ keys flip through all 26. Switching changes two
  things at once:
  - the page itself, by swapping in that theme's real Bootswatch CSS
    (`bootswatch@5.3.8`, same version as the themes);
  - a mock VS Code window (title bar, activity bar, sidebar with file tree,
    editor tabs, line numbers, current-line highlight, code, terminal panel,
    status bar) coloured entirely from that theme's generated JSON in
    `themes/`.
  Under the headline: theme name, tagline, an "Install for VS Code" button and a
  "View on Bootswatch" link to the theme on bootswatch.com.
- **Clickable editor tabs** in the mock window, each a different sample file, so
  visitors see every token type. Samples are longer than the mockup's 15 lines.
  Source material: `/Volumes/Dev/vs-code-themes/token-samples/` (TSX, CSS, HTML,
  Markdown, JSON, Python), copied into the site, not linked.
- **Terminal panel** shows coloured output in the theme's ANSI colours (the
  16-colour output of `token-samples/ansi-colors.sh` is the reference).
- **Docs page:** installing, choosing a theme in VS Code, which themes are light
  and dark, how colours are derived from Bootswatch, and the readability rule
  (code text ≥ 4.5:1, comments ≥ 4:1, muted UI ≥ 3:1, lightness-only
  adjustments), which explains why some colours differ slightly from the web.
  Mention Quartz's hand-picked darker surfaces.
- **Release notes page:** one entry per version, starting with 1.0.0.
- **Footer on every page:** credit to Bootswatch and Thomas Park (MIT; the
  notice must be kept), GitHub link, and a Marketplace link once published.
- **Each theme is linkable**, e.g. `/themes/#flatly` or `/themes/flatly/`, so a
  teacher can send students straight to one.

## Constraints

- **Default theme is Superhero** (owner's favourite). The site opens in
  Superhero, and the switcher lands on Superhero unless the link names a theme.
- **Accuracy:** code highlighting must use the extension's actual theme files via
  Shiki (VS Code's TextMate grammars), not hand-tagged spans. Editor chrome
  colours come from the same files. Regenerating the themes and rebuilding the
  site must be enough to update it; no screenshots to maintain.
- Static output only; hosted on GitHub Pages.
- Bootswatch CSS is loaded from a pinned CDN URL
  (`https://cdn.jsdelivr.net/npm/bootswatch@5.3.8/dist/<name>/bootstrap.min.css`)
  or vendored; either way pinned to 5.3.8.
- Must work on a classroom projector and on a phone.

## Anti-goals

- **A light theme as the default.** Owner: that "would make me wince."
- A site whose previews drift from what the extension actually ships
  (screenshots, hand-picked colours).
- Anything that buries the switch-a-theme moment under marketing copy.

## Decided

- **Highlighting fidelity (decided by owner): Shiki plus bracket pair
  colours.** TextMate highlighting via Shiki with the shipped theme files, plus
  bracket-pair colouring using each theme's `editorBracketHighlight.foreground1`–`6`
  (nesting depth cycles through them, as VS Code does by default). Semantic
  highlighting is **not** emulated; the Docs page notes that real VS Code with a
  language server will differ slightly (italic gray parameters, read-only
  constants in the number colour, built-ins like `console` in the keyword
  colour).

- **Stack: Astro** (my call; the owner has no preference). Static output,
  built-in Shiki, Markdown for Docs and Release notes.
- **Location:** a `site/` folder in the suite repo
  (`narcisolobo.bootswatch-1.0.0`). Deployed with a GitHub Actions workflow to
  Pages. (my call)
- **Theme choice persists across pages:** once a visitor picks a theme, Home,
  Docs and Release notes use it too, and it's remembered next visit
  (localStorage, with Superhero as the fallback). (my call)
- **Taglines** must be checked against bootswatch.com's real ones; the mockup's
  were from memory.
- **"Install for VS Code" before publishing** links to the Docs install section;
  one site config value switches it (and the footer link) to the Marketplace page
  once published. No `.vsix` packaging in CI for now. (my call)
- **Release notes source:** a single `CHANGELOG.md` at the suite repo root, which
  the site reads at build time and the Marketplace will use later. The generator
  doesn't touch root files other than `package.json`, so it's safe there. The
  builder drafts the 1.0.0 entry from the git history (26 themes generated;
  Quartz's hand-picked surfaces; readable panel text; readable terminal white on
  light themes) for the owner to review. (my call)
- **GitHub owner/repo name** is one config value (placeholder until the repo
  exists), used for the base path and links. (my call)

## Prerequisites outside the build

- A GitHub repo for the suite (none exists; no remote is configured). The owner
  creates it; the builder documents the one-time Pages setup.
- `site/` must later be excluded from the published extension (`.vscodeignore`,
  part of the deferred publishing pass).

## Left to the builder

- How highlighted samples switch themes at runtime (e.g. Shiki multi-theme output
  with CSS variables, or pre-rendered HTML per theme) as long as switching is
  instant and offline after load.
- Home-card previews: a small live mock editor drawn from theme colours is
  preferred over images; exact design is the builder's call.
- How the theme JSON gets into the site build (read from `../themes/` at build
  time is preferred over copying).
- Navbar layout, page structure inside Docs, sample length (longer than 15
  lines; enough to show every token type in that language).
- Whether the base path is configured for a project Pages site
  (`/<repo-name>/`).
