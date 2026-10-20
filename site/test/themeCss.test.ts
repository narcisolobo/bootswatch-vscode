import { expect, test } from "vitest";
import { loadThemes } from "../src/lib/themes";
import { chromeVars, cssVarName, themeCss } from "../src/lib/themeCss";

test("var names", () => expect(cssVarName("tab.activeBorderTop")).toBe("--vsc-tab-activeBorderTop"));

test("quartz uses its hand-picked surfaces", () => {
  const q = loadThemes().find((t) => t.name === "quartz")!;
  expect(chromeVars(q)["--vsc-editor-background"]).toBe("#232655");
});

test("missing key falls back, never undefined", () => {
  const t = { ...loadThemes()[0] };
  t.json = { ...t.json, colors: { "editor.background": "#111111", "editor.foreground": "#eeeeee" } };
  const v = chromeVars(t);
  expect(Object.values(v)).not.toContain(undefined);
  expect(v["--vsc-tab-activeBackground"]).toBe("#111111");
  expect(v["--vsc-tab-activeForeground"]).toBe("#eeeeee");
  expect(v["--vsc-terminal-ansiRed"]).toBe("#eeeeee");
});

test("one rule per theme, no undefined", () => {
  const css = themeCss(loadThemes());
  expect(css.match(/html\[data-theme="/g)).toHaveLength(26);
  expect(css).not.toMatch(/undefined/);
});
