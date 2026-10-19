import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { TAGLINES } from "./taglines";

export type VSCodeTheme = {
  name: string;
  type: "light" | "dark";
  colors: Record<string, string>;
  tokenColors: { name?: string; scope?: string | string[]; settings: Record<string, string> }[];
  [key: string]: unknown;
};

export type ThemeInfo = {
  name: string;
  label: string;
  type: "light" | "dark";
  tagline: string;
  json: VSCodeTheme;
};

// Astro builds run with cwd = site/, as do the tests.
const defaultSuiteDir = () => resolve(process.cwd(), "..");

export function loadThemes(suiteDir: string = defaultSuiteDir()): ThemeInfo[] {
  const pkg = JSON.parse(readFileSync(resolve(suiteDir, "package.json"), "utf8"));
  const entries: { label: string; path: string }[] = pkg.contributes.themes;
  return entries
    .map(({ label, path }) => {
      const file = resolve(suiteDir, path);
      if (!existsSync(file)) throw new Error(`Theme file missing for "${label}": ${file}`);
      const json: VSCodeTheme = JSON.parse(readFileSync(file, "utf8"));
      const name = basename(path).replace(/-color-theme\.json$/, "");
      return {
        name,
        label: label.replace(/^Bootswatch /, ""),
        type: json.type,
        tagline: TAGLINES[name] ?? "",
        json,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
