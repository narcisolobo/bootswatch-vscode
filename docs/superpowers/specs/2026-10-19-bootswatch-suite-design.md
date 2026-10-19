# Bootswatch theme suite for VS Code — design

Date: 2026-10-19

## Intent

Port every Bootswatch theme to VS Code and ship them together as one
extension, the way multi-variant theme packs (Catppuccin, GitHub Theme)
ship several entries in the Color Theme picker from a single install.

The draw is recognition: someone who knows Flatly or Superhero from the web
should recognise it in the editor. So the guiding principle is **fidelity to
the original Bootswatch colours**, bent only as far as readability requires.

## Goals

- One extension, `narcisolobo.bootswatch`, contributing every theme in the
  current Bootswatch 5 release (26 themes as of 5.3: Brite, Cerulean, Cosmo,
  Cyborg, Darkly, Flatly, Journal, Litera, Lumen, Lux, Materia, Minty, Morph,
  Pulse, Quartz, Sandstone, Simplex, Sketchy, Slate, Solar, Spacelab,
  Superhero, United, Vapor, Yeti, Zephyr). Confirm the list against the
  release used.
- Each theme keeps its native mode: light Bootswatch themes become light VS
  Code themes (`"type": "light"`, `uiTheme: "vs"`), dark ones become dark.
- Every theme's colours come from Bootswatch's own source
  (`dist/<theme>/_variables.scss`), pinned to a specific Bootswatch version
  recorded in the generator.
- Code text meets WCAG AA: 4.5:1 against the editor background.
- The first pass is a working extension the owner can install locally and
  judge theme by theme.

## Non-goals (this pass)

- Marketplace readiness: README with screenshots, icon, LICENSE, Bootswatch
  attribution, `.vscodeignore`, packaging with `vsce`. All of that comes after
  the owner is satisfied with the themes. (Note for later: Bootswatch is MIT;
  its copyright notice must ship with the published extension.)
- Dark variants of light themes (e.g. "Minty Dark"). Possible second wave.
- Changes to the existing daisyUI, Radix, PICO-8, or Cyberpunk themes.
- Deciding the fate of the standalone `narcisolobo.quartz-1.0.0`,
  `narcisolobo.superhero-1.0.0`, `narcisolobo.vapor-1.0.0` folders. Leave
  them untouched.

## Anti-goals

- **No house style rules layered on top of Bootswatch.** The owner explicitly
  rejected blanket rules such as "never use white for a token colour." If a
  theme looks clearly off once seen, it gets a per-theme fix, not a global
  rule.
- Don't invent colours where Bootswatch provides one. Derived colours (grays
  for sidebars, overlays, contrast adjustments) must come from the theme's own
  variables, or be one of the theme's own colours with only its OKLCH
  lightness changed (contrast fixes, and the dark-surface fallback below).
- Don't hand-tune colour assignments per theme in the first pass. One formula
  for all themes (below); per-theme overrides only to fix things the owner
  flags after seeing them.

## Constraints

### Readability (decided by owner)

- Syntax and UI text: ≥ 4.5:1 against the editor background (WCAG AA).
- Comments: may stay dimmer, ≥ 4.0:1.
- Line numbers, inactive tabs, other muted UI text: may stay dimmer, ≥ 3.0:1.
- When a Bootswatch colour falls short, adjust **lightness only** in OKLCH,
  keeping hue and chroma (gamut-clipped). This is what `theme-generator`'s
  `lighten_to` already does; on light backgrounds it darkens.
- Text on the accent colour (status bar, buttons, badges) must also reach
  4.5:1; the generator's existing `best_on` swap (to black/white/etc.) handles
  this even where it departs from Bootswatch's white-on-primary.

### Existing tooling (decided by owner: reuse it)

Build on `/Volumes/Dev/vs-code-themes/theme-generator` (`gen_themes.py`,
`palettes.py`) rather than a new tool. Owner's words: "We can re-run the theme
generator." Its current limits, which this work must lift:

- Dark only: hardcodes `"type": "dark"` and `uiTheme: "vs-dark"`. Needs light
  support (theme type chosen per theme from Bootswatch's mode). Check the
  dark-only assumptions elsewhere too, e.g. `widget.shadow`, `best_on`
  candidates, the `lighten_to` step direction, and the `shift_l(+0.08)` used
  for bright ANSI colours, which should go darker-or-more-saturated on light
  themes rather than washing out.
- One extension per theme, written to `~/.vscode/extensions` and registered in
  `extensions.json`. The suite needs a second output mode: write every
  Bootswatch theme into `narcisolobo.bootswatch-1.0.0/themes/` and generate a
  single `package.json` listing all of them. The existing per-theme mode and
  its outputs for daisyUI/Radix/etc. must keep working unchanged.
- The existing Quartz, Superhero, and Vapor ports were not made by the
  generator and are not in `palettes.py`. In the suite they are regenerated
  from Bootswatch source like every other theme. The hand-edited Vapor in the
  repo does not need to be preserved.

## The colour formula (decided: one formula for every theme)

Every Bootswatch theme defines Bootstrap's standard Sass variables, so a
single mapping applies to all of them:

| Generator role | Bootswatch variable |
|---|---|
| `bg` (editor) | `$body-bg` |
| `fg`, `variable` | `$body-color` |
| `bg2`, `bg3`, `widget` (sidebar/tabs, activity/title bar, popups) | neighbouring steps of the theme's own `$gray-100`…`$gray-900` scale, chosen to sit just darker than `bg` on dark themes and just darker/greyer than `bg` on light themes |
| — fallback (decided by owner) | where no gray in the theme's scale sits just darker than `bg` and in the same hue family (e.g. Darkly and Slate, where `bg` is already `$gray-900`; near-black Cyborg; tinted Superhero, Solar, Vapor), derive `bg2`/`bg3` from `$body-bg` by **lowering OKLCH lightness only**, keeping hue and chroma. This is the one allowed exception to "no derived colours outside the theme's variables"; it is the same lightness-only adjustment used for contrast. `widget` may go slightly lighter than `bg` the same way. |
| `muted`, `comment`, `punct`, `param` | the theme's mid grays |
| `accent` (status bar, buttons, cursor, active tab) | `$primary` |
| `accent2` | `$secondary`, falling back like syntax roles if it's a gray |
| `keyword`, `tag`, `heading` | `$primary` |
| `string` | `$success` |
| `function`, `link` | `$info` |
| `type`, `attr` | `$warning` |
| `number` | `$orange` |
| `property` | `$purple` |
| `regex` | `$pink` |
| `error` / `warning` / `info` / `success` | `$danger` / `$warning` / `$info` / `$success` |
| ANSI colours | `$red`, `$green`, `$yellow`, `$blue`, `$purple`/`$pink`, `$cyan`, plus grays |

Rationale: `$primary` is each theme's identity, so it takes the two most-seen
surfaces (keywords and the status bar). The semantic colours cover the main
syntax roles; Bootswatch's named hues fill the rest.

**Fallback rule.** Some themes have a near-colourless `$primary` (Slate
`#3a3f44`, Sketchy and Lux near-black) or two semantic colours that are almost
identical. When a syntax role's mapped colour has very low chroma, or, after
contrast adjustment, is too close to a role already assigned, it takes the
next unused named hue instead (`$blue`, `$indigo`, `$purple`, `$pink`, `$red`,
`$orange`, `$yellow`, `$green`, `$teal`, `$cyan`). The status bar/accent
keeps `$primary` even when it's gray: that's the theme's real look. The
generator's existing similarity check (`de < 0.08`) is the starting
definition of "too close"; tune as needed.

## Left to the builder

- How Bootswatch variables are obtained and stored (vendored `_variables.scss`
  files, a parsed JSON snapshot like `radix_dark.json`, etc.), including
  resolving Sass expressions (`darken()`, `mix()`, `shade-color()`, variable
  references) to concrete hex. Bootstrap's defaults apply wherever a theme
  doesn't override a variable.
- Themes with non-solid backgrounds (Quartz uses a gradient body background):
  pick a representative solid colour from the theme's own values.
- Exact chroma threshold for "colourless" and the precise gray steps for
  surfaces.
- Theme labels in the picker (suggested: "Bootswatch Flatly", so the suite
  groups together), file names, and `package.json` metadata. Extension
  `name`: `bootswatch`, `publisher`: `narcisolobo`, `version`: `1.0.0`.
- How the owner installs it locally for judging (e.g. symlink or copy into
  `~/.vscode/extensions` plus `extensions.json` registration, or
  `code --install-extension` on a packaged `.vsix`), as long as it's one
  command and documented in the generator README.
- Reporting: keep the generator's contrast/similarity report and make it
  show, per theme, which roles fell back and which colours were adjusted, so
  the owner can see where fidelity was bent.

## Done when

- `narcisolobo.bootswatch-1.0.0` contains one `package.json` and one theme
  file per Bootswatch theme, all produced by the generator.
- The owner can install it with one documented command and every theme
  appears in the Color Theme picker, light themes as light, dark as dark.
- Every theme passes the contrast floors above (report shows no `LOW`).
- Re-running the generator for the existing daisyUI/Radix/PICO-8 themes
  produces byte-identical output to before.
