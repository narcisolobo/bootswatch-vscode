# Bootswatch for VS Code

All 26 [Bootswatch](https://bootswatch.com) themes as VS Code color themes. If you've built a site with Superhero or Flatly, your editor can now match it.

When I was first learning to code, Bootswatch felt like magic. I'd change one `<link>` tag and my plain little page would suddenly look like something a real designer made. Then I'd change it again, just to watch it happen. This extension is my way of bringing that feeling into the place I spend most of my day now.

**See every theme live before installing:** [narcisolobo.github.io/bootswatch-vscode](https://narcisolobo.github.io/bootswatch-vscode/). Press ← and → on the Themes page to flip through them in a mock editor colored from the same files this extension ships.

## Choosing a theme

1. Open the Command Palette (Cmd+Shift+P on macOS, Ctrl+Shift+P elsewhere).
2. Run **Preferences: Color Theme**.
3. Type "Bootswatch" and use the arrow keys to preview each one.

## The themes

Light Bootswatch themes stay light in VS Code, and dark ones stay dark.

**Dark (7):** Cyborg, Darkly, Quartz, Slate, Solar, Superhero, Vapor

**Light (19):** Brite, Cerulean, Cosmo, Flatly, Journal, Litera, Lumen, Lux, Materia, Minty, Morph, Pulse, Sandstone, Simplex, Sketchy, Spacelab, United, Yeti, Zephyr

## Where the colors come from

Every color is taken from the theme's own Bootswatch 5.3.8 variables, using one formula for all 26. The primary color becomes keywords and the status bar. Success becomes strings, info becomes functions, and warning becomes types. Sidebars and tabs use the theme's gray scale.

Quartz is the one exception. Its gradient background has no single color that works behind code, so it gets darker surfaces picked by hand.

## Readable first

Some Bootswatch colors look great on a button and poor behind code. Each theme is checked against its editor background:

- Code text reaches at least 4.5:1 contrast (WCAG AA).
- Comments reach at least 4:1.
- Line numbers, inactive tabs and other muted text reach at least 3:1.

When a color falls short, only its lightness changes. Hue and saturation stay put, so a few colors are slightly lighter or darker than on the web.

## Credits

Themes based on [Bootswatch](https://bootswatch.com) by Thomas Park, MIT License. This extension is not affiliated with Bootswatch.

Found a color that's hard to read? [Open an issue](https://github.com/narcisolobo/bootswatch-vscode/issues).
