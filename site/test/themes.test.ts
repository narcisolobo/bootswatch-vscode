import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { loadThemes } from "../src/lib/themes";
import { TAGLINES } from "../src/lib/taglines";

test("loads all 26 themes with type and tagline", () => {
  const t = loadThemes();
  expect(t).toHaveLength(26);
  const sh = t.find((x) => x.name === "superhero")!;
  expect(sh).toMatchObject({ label: "Superhero", type: "dark", tagline: "The brave and the blue" });
  expect(t.find((x) => x.name === "flatly")!.type).toBe("light");
  expect(t.filter((x) => x.type === "dark").map((x) => x.name).sort())
    .toEqual(["cyborg", "darkly", "quartz", "slate", "solar", "superhero", "vapor"]);
});

test("every theme has a tagline", () => {
  for (const t of loadThemes()) expect(TAGLINES[t.name], t.name).toBeTruthy();
});

test("missing theme file throws", () => {
  const tmp = mkdtempSync(join(tmpdir(), "suite-"));
  writeFileSync(
    join(tmp, "package.json"),
    JSON.stringify({
      contributes: {
        themes: [{ label: "Bootswatch Ghost", uiTheme: "vs", path: "./themes/ghost-color-theme.json" }],
      },
    }),
  );
  expect(() => loadThemes(tmp)).toThrow(/ghost/);
});
