// Reads site/dist, so run `npm run build` first.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const home = read("dist/index.html");
const themes = read("dist/themes/index.html");

test("home wall has 26 cards linking to the switcher", () => {
  expect(home.match(/class="card[ "]/g)).toHaveLength(26);
  expect(home).toContain('themes/#superhero"');
});

test("themes page has six tabs and samples", () => {
  for (const f of ["swatch.tsx", "theme.css", "index.html", "README.md", "package.json", "colors.py"]) {
    expect(themes).toContain(f);
  }
  expect(themes.match(/<pre class="code"/g)).toHaveLength(6);
  expect(themes).toContain("The brave and the blue");
});

test("docs has install anchor and readability numbers", () => {
  const d = read("dist/docs/index.html");
  expect(d).toMatch(/id="install"/);
  expect(d).toContain("4.5:1");
});

test("release notes render the changelog", () => expect(read("dist/releases/index.html")).toContain("1.0.0"));
