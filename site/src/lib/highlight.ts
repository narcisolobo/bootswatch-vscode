import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHighlighter } from "shiki";
import type { ThemeInfo } from "./themes";

export type Sample = { id: string; file: string; lang: string; code: string };

const SAMPLE_FILES: { id: string; file: string; source: string }[] = [
  { id: "tsx", file: "swatch.tsx", source: "sample.tsx" },
  { id: "css", file: "theme.css", source: "sample.css" },
  { id: "html", file: "index.html", source: "sample.html" },
  { id: "md", file: "README.md", source: "sample.md" },
  { id: "json", file: "package.json", source: "sample.json" },
  { id: "py", file: "colors.py", source: "sample.py" },
];

// Astro builds run with cwd = site/, as do the tests.
export const SAMPLES: Sample[] = SAMPLE_FILES.map(({ id, file, source }) => ({
  id,
  file,
  lang: id,
  code: readFileSync(resolve(process.cwd(), "src/samples", source), "utf8"),
}));

// Languages that fenced code in the Markdown sample may embed.
const EXTRA_LANGS = ["bash", "javascript", "typescript", "json", "css"];

const CLOSERS: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Look = { color?: string; fontStyle: number };

function lookCss(look: Look): string {
  const parts: string[] = [];
  if (look.color) parts.push(`color:${look.color}`);
  if (look.fontStyle & 1) parts.push("font-style:italic");
  if (look.fontStyle & 2) parts.push("font-weight:bold");
  if (look.fontStyle & 4) parts.push("text-decoration:underline");
  if (look.fontStyle & 8) parts.push("text-decoration:line-through");
  return parts.join(";");
}

export async function renderSamples(
  samples: Sample[],
  themes: ThemeInfo[],
): Promise<{ html: Record<string, string>; css: string }> {
  const names = themes.map((t) => t.name);
  const highlighter = await createHighlighter({
    themes: themes.map((t) => ({ ...t.json, name: t.name })) as never[],
    langs: [...new Set([...samples.map((s) => s.lang), ...EXTRA_LANGS])],
  });
  const themeMap = Object.fromEntries(names.map((n) => [n, n]));

  // Classes are shared by every segment that looks the same in every theme.
  const classByKey = new Map<string, string>();
  const looksByClass: Look[][] = [];
  const classFor = (looks: Look[]): string => {
    const key = looks.map((l) => `${l.color ?? ""}|${l.fontStyle}`).join(";");
    let cls = classByKey.get(key);
    if (!cls) {
      cls = `t${classByKey.size}`;
      classByKey.set(key, cls);
      looksByClass.push(looks);
    }
    return cls;
  };

  const html: Record<string, string> = {};
  for (const sample of samples) {
    const lines = highlighter.codeToTokensWithThemes(sample.code, {
      lang: sample.lang,
      themes: themeMap,
      includeExplanation: true,
    });
    if (lines.length > 1 && lines[lines.length - 1].length === 0 && sample.code.endsWith("\n")) lines.pop();

    const stack: string[] = [];
    const out: string[] = [];
    lines.forEach((tokens, lineIdx) => {
      let body = "";
      for (const token of tokens) {
        // Per-character flag: is this character code, rather than a string or comment?
        const isCode: boolean[] = [];
        for (const piece of token.explanation ?? []) {
          const code = !piece.scopes.some((s) => /^(string|comment)\b/.test(s.scopeName));
          for (let i = 0; i < piece.content.length; i++) isCode.push(code);
        }
        const baseLooks: Look[] = names.map((n) => ({
          color: token.variants[n]?.color,
          fontStyle: (token.variants[n]?.fontStyle as number | undefined) ?? 0,
        }));

        const emit = (text: string, looks: Look[]) => {
          if (!text) return;
          body += /^\s+$/.test(text)
            ? escapeHtml(text)
            : `<span class="${classFor(looks)}">${escapeHtml(text)}</span>`;
        };

        let run = "";
        for (let i = 0; i < token.content.length; i++) {
          const ch = token.content[i];
          const inCode = isCode[i] ?? true;
          let depth: number | null = null;
          if (inCode && (ch === "(" || ch === "[" || ch === "{")) {
            depth = stack.length;
            stack.push(ch);
          } else if (inCode && CLOSERS[ch] && stack[stack.length - 1] === CLOSERS[ch]) {
            stack.pop();
            depth = stack.length;
          }
          if (depth === null) {
            run += ch;
            continue;
          }
          emit(run, baseLooks);
          run = "";
          const key = `editorBracketHighlight.foreground${(depth % 6) + 1}`;
          emit(
            ch,
            themes.map((t, k) => ({ color: t.json.colors[key] ?? baseLooks[k].color, fontStyle: 0 })),
          );
        }
        emit(run, baseLooks);
      }
      out.push(`<span class="line"><span class="ln">${lineIdx + 1}</span>${body}</span>`);
    });
    html[sample.id] = `<pre class="code"><code>${out.join("\n")}</code></pre>`;
  }

  const rules: string[] = [];
  looksByClass.forEach((looks, idx) => {
    looks.forEach((look, k) => {
      const decl = lookCss(look);
      if (decl) rules.push(`html[data-theme="${names[k]}"] .t${idx}{${decl}}`);
    });
  });
  return { html, css: rules.join("\n") };
}
