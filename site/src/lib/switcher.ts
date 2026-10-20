// Pure theme-switching logic. initialTheme, safeStore and bootswatchHref must stay
// self-contained (no references to other module members): Base.astro inlines their
// source into a script that runs before first paint.

export function bootswatchHref(name: string): string {
  return "https://cdn.jsdelivr.net/npm/bootswatch@5.3.8/dist/" + name + "/bootstrap.min.css";
}

export function initialTheme(
  names: string[],
  hash: string,
  stored: string | null,
  fallback = "superhero",
): string {
  const find = (candidate: string | null | undefined) => {
    if (!candidate) return undefined;
    const wanted = candidate.replace(/^#/, "").toLowerCase();
    return names.find((n) => n === wanted);
  };
  return find(hash) ?? find(stored) ?? fallback;
}

export function stepTheme(names: string[], current: string, delta: 1 | -1): string {
  const i = names.indexOf(current);
  const from = i === -1 ? 0 : i;
  return names[(from + delta + names.length) % names.length];
}

export function shouldFlip(key: string, targetTag: string): boolean {
  if (key !== "ArrowLeft" && key !== "ArrowRight") return false;
  return targetTag !== "INPUT" && targetTag !== "SELECT" && targetTag !== "TEXTAREA";
}

export function safeStore(storage: Pick<Storage, "getItem" | "setItem"> | undefined) {
  return {
    get(): string | null {
      try {
        return storage ? storage.getItem("bootswatch-theme") : null;
      } catch {
        return null;
      }
    },
    set(v: string): void {
      try {
        if (storage) storage.setItem("bootswatch-theme", v);
      } catch {
        // storage blocked: the choice still holds for this page view
      }
    },
  };
}
