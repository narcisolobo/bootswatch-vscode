import { expect, test } from "vitest";
import { loadThemes } from "../src/lib/themes";
import { previewColors } from "../src/lib/preview";

const themes = loadThemes();

test("flatly preview colors come straight from the theme file", () => {
  const flatly = themes.find((t) => t.name === "flatly")!;
  expect(previewColors(flatly)).toEqual({
    background: flatly.json.colors["editor.background"],
    keyword: "#2c3e50",
    string: "#06856e",
    function: "#027cbd",
    type: "#a76800",
    comment: "#738283",
  });
});

test("every theme yields real colors for all five bars", () => {
  for (const t of themes) {
    for (const [k, v] of Object.entries(previewColors(t))) {
      expect(v, `${t.name} ${k}`).toMatch(/^#[0-9a-fA-F]{6,8}$/);
    }
  }
});

test("falls back to the editor foreground when a scope is missing", () => {
  const t = { ...themes[0], json: { ...themes[0].json, tokenColors: [] } };
  expect(previewColors(t).keyword).toBe(t.json.colors["editor.foreground"]);
});
