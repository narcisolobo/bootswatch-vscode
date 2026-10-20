import type { ThemeInfo } from "./themes";

const ANSI = ["Black", "Red", "Green", "Yellow", "Blue", "Magenta", "Cyan", "White"];

export const CHROME_KEYS: string[] = [
  "editor.background",
  "editor.foreground",
  "editorLineNumber.foreground",
  "editorLineNumber.activeForeground",
  "editor.lineHighlightBackground",
  "sideBar.background",
  "sideBar.foreground",
  "sideBarTitle.foreground",
  "list.activeSelectionBackground",
  "list.hoverBackground",
  "activityBar.background",
  "activityBar.foreground",
  "activityBar.inactiveForeground",
  "activityBar.activeBorder",
  "titleBar.activeBackground",
  "titleBar.activeForeground",
  "editorGroupHeader.tabsBackground",
  "tab.activeBackground",
  "tab.activeForeground",
  "tab.inactiveBackground",
  "tab.inactiveForeground",
  "tab.activeBorderTop",
  "statusBar.background",
  "statusBar.foreground",
  "panel.border",
  "terminal.background",
  "terminal.foreground",
  ...ANSI.map((c) => `terminal.ansi${c}`),
  ...ANSI.map((c) => `terminal.ansiBright${c}`),
];

export const cssVarName = (key: string): string => `--vsc-${key.replace(/\./g, "-")}`;

const isForegroundLike = (key: string) => /[fF]oreground|^terminal\.ansi/.test(key);

export function chromeVars(theme: ThemeInfo): Record<string, string> {
  const colors = theme.json.colors ?? {};
  const fg = colors["editor.foreground"] ?? colors["foreground"] ?? "#cccccc";
  const bg = colors["editor.background"] ?? "#1e1e1e";
  const vars: Record<string, string> = {};
  for (const key of CHROME_KEYS) {
    vars[cssVarName(key)] = colors[key] ?? (isForegroundLike(key) ? fg : bg);
  }
  return vars;
}

export function themeCss(themes: ThemeInfo[]): string {
  return themes
    .map((t) => {
      const decls = Object.entries(chromeVars(t))
        .map(([k, v]) => `${k}:${v};`)
        .join("");
      return `html[data-theme="${t.name}"]{${decls}}`;
    })
    .join("\n");
}
