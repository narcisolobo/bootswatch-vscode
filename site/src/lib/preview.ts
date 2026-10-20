import type { ThemeInfo } from "./themes";

export type PreviewColors = {
  background: string;
  keyword: string;
  string: string;
  function: string;
  type: string;
  comment: string;
};

// The color the theme file gives a scope, read from tokenColors.
function scopeColor(theme: ThemeInfo, scope: string): string {
  const rule = theme.json.tokenColors.find((r) => [r.scope ?? []].flat().includes(scope));
  return rule?.settings.foreground ?? theme.json.colors["editor.foreground"];
}

export function previewColors(theme: ThemeInfo): PreviewColors {
  return {
    background: theme.json.colors["editor.background"],
    keyword: scopeColor(theme, "keyword"),
    string: scopeColor(theme, "string"),
    function: scopeColor(theme, "entity.name.function"),
    type: scopeColor(theme, "entity.name.type"),
    comment: scopeColor(theme, "comment"),
  };
}
