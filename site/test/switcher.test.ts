import { expect, test } from "vitest";
import { bootswatchHref, initialTheme, safeStore, shouldFlip, stepTheme } from "../src/lib/switcher";

const names = ["darkly", "flatly", "superhero"];

test("hash wins, then storage, then superhero", () => {
  expect(initialTheme(names, "#flatly", "darkly")).toBe("flatly");
  expect(initialTheme(names, "#FLATLY", null)).toBe("flatly");
  expect(initialTheme(names, "", "darkly")).toBe("darkly");
  expect(initialTheme(names, "#nonsense", "gone")).toBe("superhero"); // Review Focus 1
  expect(initialTheme(names, "", null)).toBe("superhero");
});

test("step wraps", () => {
  expect(stepTheme(names, "superhero", 1)).toBe("darkly");
  expect(stepTheme(names, "darkly", -1)).toBe("superhero");
  expect(stepTheme(names, "flatly", 1)).toBe("superhero");
});

test("arrows ignored inside form controls", () => {
  // Review Focus 4
  expect(shouldFlip("ArrowRight", "BODY")).toBe(true);
  expect(shouldFlip("ArrowRight", "SELECT")).toBe(false);
  expect(shouldFlip("ArrowLeft", "INPUT")).toBe(false);
  expect(shouldFlip("ArrowLeft", "TEXTAREA")).toBe(false);
  expect(shouldFlip("Enter", "BODY")).toBe(false);
});

test("blocked storage never throws", () => {
  // Review Focus 2
  const s = safeStore({
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  });
  expect(s.get()).toBeNull();
  expect(() => s.set("flatly")).not.toThrow();
  expect(safeStore(undefined).get()).toBeNull();
});

test("working storage round-trips", () => {
  const data = new Map<string, string>();
  const s = safeStore({
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
  });
  s.set("flatly");
  expect(s.get()).toBe("flatly");
});

test("pinned href", () =>
  expect(bootswatchHref("flatly")).toBe(
    "https://cdn.jsdelivr.net/npm/bootswatch@5.3.8/dist/flatly/bootstrap.min.css",
  ));
