/**
 * Token sample for judging color themes.
 * Block comment, with a JSDoc tag: @param name - the user's name
 */
// Line comment: TODO check italics on comments

import React, { useState } from "react";
import type { ReactNode } from "react";

// ---------- namespaces, enums, interfaces, types ----------
namespace Geometry {
  export const PI_ISH = 3.14159;
}

enum Status {
  Idle,
  Loading = "loading",
  Done = 0x2a,
}

interface Theme {
  readonly name: string;
  dark?: boolean;
  colors: Record<string, `#${string}`>;
}

type Pair<T, U = T> = [first: T, second: U];

// ---------- constants, numbers, language constants ----------
const MAX_THEMES = 26;
const ratio = 4.5e0;
const big = 1_000_000n;
const flags = [true, false, null, undefined, NaN, Infinity];

// ---------- strings, templates, escapes, regex ----------
const single = 'single quoted';
const double = "double quoted with \"escapes\" and \n newline \t tab é";
const template = `Theme ${MAX_THEMES} of ${Geometry.PI_ISH.toFixed(2)}`;
const hex = /^#(?:[0-9a-f]{3}){1,2}$/gi;

// ---------- classes, inheritance, this, methods, properties ----------
abstract class Base {
  protected static count = 0;
  abstract describe(): string;
}

export class ThemeCard extends Base implements Theme {
  readonly name: string;
  colors: Theme["colors"] = {};
  #secret = Symbol("private");

  constructor(name: string, public dark = false) {
    super();
    this.name = name;
    ThemeCard.count++;
  }

  get label(): string {
    return this.name.toUpperCase();
  }

  describe(): string {
    return `${this.label}${this.dark ? " (dark)" : ""}`;
  }
}

// ---------- functions, parameters, operators, control flow ----------
function contrast(foreground: string, background: string, ...rest: number[]): number {
  const [a, b] = [foreground.length, background.length];
  if (a === b && !rest.length) return 1;
  else if (a > b || a <= 0) return a / b;
  for (let i = 0; i < rest.length; i += 1) {
    if (typeof rest[i] !== "number") continue;
  }
  while (false) break;
  switch (a % 3) {
    case 0:
      return a ** 2 >> 1;
    default:
      return (a & b) | (~a ^ b);
  }
}

const arrow = async (items: readonly Pair<number>[]): Promise<number> => {
  try {
    const total = items.reduce((sum, [x, y]) => sum + x * y, 0);
    await new Promise((resolve) => setTimeout(resolve, 10));
    return total ?? 0;
  } catch (err: unknown) {
    console.error(err instanceof Error ? err.message : String(err));
    throw err;
  } finally {
    Math.max(1, 2);
  }
};

function* ids(): Generator<number, void, unknown> {
  let id = 0;
  while (true) yield id++;
}

// ---------- object literals, destructuring, optional chaining ----------
const settings = {
  theme: "Bootswatch Flatly",
  "editor.fontSize": 14,
  nested: { deep: { value: [1, 2, 3] } },
  method() {
    return this.nested?.deep?.value.at(-1);
  },
};
const { theme, ...others } = settings;
delete (others as any).method;
void others;

// ---------- JSX: tags, attributes, components ----------
export function Swatch({ color, children }: { color: string; children?: ReactNode }) {
  const [active, setActive] = useState<boolean>(false);
  return (
    <div className="swatch" style={{ background: color }} data-active={active}>
      <button type="button" onClick={() => setActive(!active)} disabled={false}>
        {children ?? "Toggle"}
      </button>
      <ThemeLabel name={theme} />
    </div>
  );
}

const ThemeLabel = ({ name }: { name: string }) => <span aria-label={name}>{name}</span>;

export default Status;
