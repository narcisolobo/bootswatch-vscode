import { expect, test } from "vitest";
import { loadThemes } from "../src/lib/themes";
import { renderSamples, SAMPLES } from "../src/lib/highlight";

const themes = loadThemes();
const sh = themes.find((t) => t.name === "superhero")!.json;
const out = await renderSamples(
  [{ id: "t", file: "t.ts", lang: "ts", code: 'f(a[b{c}]); "(" // (\n' }],
  themes,
);

type Out = Awaited<ReturnType<typeof renderSamples>>;
const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

// Color (lower-case) of the i-th span whose text is `ch`, for the named theme.
function colorOf(o: Out, id: string, ch: string, i: number, theme: string): string | undefined {
  const spans = [...o.html[id].matchAll(/<span class="(t\d+)">([^<]*)<\/span>/g)].filter(
    (m) => unescape(m[2]) === ch,
  );
  const cls = spans[i]?.[1];
  if (!cls) return undefined;
  const rule = o.css.match(new RegExp(`html\\[data-theme="${theme}"\\] \\.${cls}\\{color:(#[0-9a-fA-F]+)`));
  return rule?.[1].toLowerCase();
}

// Color the theme file assigns to a scope, read straight from tokenColors.
function scopeColor(theme: string, scope: string): string {
  const json = themes.find((t) => t.name === theme)!.json;
  const rule = json.tokenColors.find((r) => [r.scope ?? []].flat().includes(scope))!;
  return rule.settings.foreground.toLowerCase();
}

const bracket = (n: number) => sh.colors[`editorBracketHighlight.foreground${n}`].toLowerCase();

test("brackets colored by depth, closers match", () => {
  const rule = (ch: string, i = 0) => colorOf(out, "t", ch, i, "superhero");
  expect(rule("(")).toBe(bracket(1));
  expect(rule("[")).toBe(bracket(2));
  expect(rule("{")).toBe(bracket(3));
  expect(rule("}")).toBe(rule("{"));
  expect(rule("]")).toBe(rule("["));
  expect(rule(")")).toBe(rule("("));
});

test("brackets in strings and comments are not bracket-colored", async () => {
  // The string and the comment stay whole tokens, so no stray "(" span exists.
  expect(colorOf(out, "t", "(", 1, "superhero")).toBeUndefined();
  // Same color as the equivalent bracket-free control.
  const ctl = await renderSamples([{ id: "c", file: "c.ts", lang: "ts", code: '"x" // x\n' }], themes);
  const str = colorOf(out, "t", '"("', 0, "superhero");
  const comment = colorOf(out, "t", "// (", 0, "superhero");
  expect(str).toBeDefined();
  expect(str).toBe(colorOf(ctl, "c", '"x"', 0, "superhero"));
  expect(comment).toBeDefined();
  expect(comment).toBe(colorOf(ctl, "c", "// x", 0, "superhero"));
});

test("keyword color matches the theme file", async () => {
  const o = await renderSamples([{ id: "k", file: "k.ts", lang: "ts", code: "const x = 1;" }], themes);
  expect(colorOf(o, "k", "const", 0, "flatly")).toBe(scopeColor("flatly", "storage.type"));
});

test("all samples render compactly", async () => {
  const o = await renderSamples(SAMPLES, themes);
  expect(Object.keys(o.html)).toEqual(["tsx", "css", "html", "md", "json", "py"]);
  expect(SAMPLES.map((s) => s.file)).toEqual([
    "swatch.tsx",
    "theme.css",
    "index.html",
    "README.md",
    "package.json",
    "colors.py",
  ]);
  for (const h of Object.values(o.html)) expect(h.length).toBeLessThan(150_000);
  expect(o.css.match(/html\[data-theme="superhero"\]/g)!.length).toBeGreaterThan(5);
});

test("unmatched closing bracket keeps its plain color", async () => {
  const o = await renderSamples([{ id: "u", file: "u.ts", lang: "ts", code: "a);\n" }], themes);
  expect(colorOf(o, "u", ")", 0, "superhero")).not.toBe(bracket(1));
});

test("adjacent brackets are split into their own spans", async () => {
  const o = await renderSamples([{ id: "s", file: "s.ts", lang: "ts", code: "f({});\n" }], themes);
  expect(colorOf(o, "s", "(", 0, "superhero")).toBe(bracket(1));
  expect(colorOf(o, "s", "{", 0, "superhero")).toBe(bracket(2));
});
