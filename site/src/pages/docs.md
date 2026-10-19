---
layout: ../layouts/Doc.astro
title: Docs
active: docs
---

## Install

Once the extension is published, install **Bootswatch Themes** from the VS Code Marketplace: open the Extensions view, search for "Bootswatch", and click Install.

Until it's published, install it from a `.vsix` file. This section will be updated with the download link and the one command to run (`code --install-extension <file>.vsix`).

## Choosing a theme

1. Open the Command Palette (Cmd+Shift+P on macOS, Ctrl+Shift+P elsewhere).
2. Run **Preferences: Color Theme**.
3. Type "Bootswatch" to see all 26 themes, and use the arrow keys to preview each one.

## Light and dark

Light Bootswatch themes become light VS Code themes, and dark ones become dark. Seven themes are dark: Cyborg, Darkly, Quartz, Slate, Solar, Superhero and Vapor. The other nineteen are light.

## How the colours are made

Every colour comes from the theme's own Bootswatch variables, using one formula for all 26 themes. The primary colour becomes keywords, tags and the status bar. Success becomes strings, info becomes functions and links, and warning becomes types. Bootswatch's named hues (orange, purple, pink) fill numbers, properties and regular expressions. Sidebars and tabs use neighbouring steps of the theme's gray scale.

A few themes have a primary colour that is close to gray, or two colours that are nearly identical. In those cases a syntax role takes the next unused named hue instead, so tokens stay distinguishable. Quartz also uses darker, hand-picked surfaces, because its gradient background has no single colour that works in an editor.

## Readability

VS Code is for reading code, so the colours are checked against the editor background:

- Code text reaches at least 4.5:1 contrast (WCAG AA).
- Comments reach at least 4:1.
- Muted interface text, such as line numbers and inactive tabs, reaches at least 3:1.

When a Bootswatch colour falls short, only its lightness is changed. Hue and chroma stay put. That is why a few colours differ slightly from the same theme on the web.

## Differences from real VS Code

The previews on this site use TextMate highlighting plus bracket-pair colours. They don't emulate semantic highlighting, which VS Code adds when a language server is running. In the real editor, function parameters can look italic and gray, read-only constants can take the number colour, and built-ins like `console` can take the keyword colour.

## Credits

Themes based on [Bootswatch](https://bootswatch.com) by Thomas Park, MIT License.
