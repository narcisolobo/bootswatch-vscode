import type { ThemeInfo } from "./themes";

export type PreviewColours = {
  background: string;
  keyword: string;
  string: string;
  function: string;
  type: string;
  comment: string;
};

// The colour the theme file gives a scope, read from tokenColors.
function scopeColour(theme: ThemeInfo, scope: string): string {
  const rule = theme.json.tokenColors.find((r) => [r.scope ?? []].flat().includes(scope));
  return rule?.settings.foreground ?? theme.json.colors["editor.foreground"];
}

export function previewColours(theme: ThemeInfo): PreviewColours {
  return {
    background: theme.json.colors["editor.background"],
    keyword: scopeColour(theme, "keyword"),
    string: scopeColour(theme, "string"),
    function: scopeColour(theme, "entity.name.function"),
    type: scopeColour(theme, "entity.name.type"),
    comment: scopeColour(theme, "comment"),
  };
}
