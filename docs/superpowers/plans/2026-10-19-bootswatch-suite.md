# Bootswatch Theme Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `theme-generator` so one command builds all 26 Bootswatch 5.3.8 themes into the single extension `narcisolobo.bootswatch-1.0.0` and installs it locally for judging.

**Architecture:** A one-off extractor reads each theme's compiled `bootstrap.css` (`:root` block) into a vendored JSON snapshot, like `radix_dark.json`. A new `bootswatch.py` turns each snapshot entry into a palette dict in the existing `THEMES` format by applying the spec's single colour formula and fallback rule. `gen_themes.py` gains light-mode support plus a suite writer and installer. The existing per-theme path stays byte-identical, guarded by golden-file tests.

**Tech Stack:** Python 3.10 standard library only (`unittest`, `json`, `re`, `os`). No pip installs: the `python3` on PATH is a virtualenv without pytest. `npm pack` is used once to fetch Bootswatch.

**Spec:** `docs/superpowers/specs/2026-10-19-bootswatch-suite-design.md` (in this repo)

**Paths:** `GEN = /Volumes/Dev/vs-code-themes/theme-generator`, `SUITE = /Volumes/Dev/vs-code-themes/narcisolobo.bootswatch-1.0.0`. Run all tests from `GEN` with `python3 -m unittest discover -s tests -t . -v`.

## Global Constraints

- Bootswatch version pinned: **5.3.8**, all 26 themes in `dist/`.
- Code and UI text ≥ **4.5:1** on the editor background; comments ≥ **4.0:1**; muted UI text (line numbers, inactive tabs) ≥ **3.0:1**.
- Colour adjustments change **OKLCH lightness only**, keeping hue and chroma (gamut-clipped).
- Light Bootswatch themes → `"type": "light"`, `uiTheme: "vs"`. Dark ones → `"type": "dark"`, `uiTheme: "vs-dark"`.
- No house style rules. No colours from outside the theme's variables, except lightness-only shifts of the theme's own colours.
- Extension: `name` `bootswatch`, `publisher` `narcisolobo`, `version` `1.0.0`, `engines.vscode` `^1.70.0`, `categories` `["Themes"]`.
- Picker labels: `Bootswatch <Name>`, e.g. `Bootswatch Flatly`.
- Output for existing daisyUI/Radix/PICO-8 themes must stay **byte-identical**.
- No Marketplace work: no README screenshots, icon, LICENSE, or `.vscodeignore` in the suite.

## Review Focus

1. **Stale theme files:** if the suite is regenerated after a theme drops out, its old JSON is removed from `themes/` rather than left as an orphan. Test in Task 5.
2. **Install run twice, or over a real folder:** `--install` is idempotent when the symlink already points at `SUITE`, and refuses (non-zero exit, clear message) to replace a real directory or a symlink pointing somewhere else. Test in Task 5.
3. **A colour lighter than a light background:** for example white `$secondary` on Morph's `#d9e3f1`. `lighten_to` must darken it to reach contrast, not push it toward white forever. Test in Task 3.
4. **Fallback runs out of hues:** a theme whose named hues all collide still gets a colour for every role, with a note and no crash. Test in Task 4.
5. **Extractor on an unexpected CSS layout:** if a required variable is missing, the extractor raises an error naming the theme and the variable instead of writing a partial snapshot. Test in Task 2.

---

### Task 0: Put `theme-generator` under version control (owner approval required)

`theme-generator` is not a git repo, so none of the generator changes below could be committed or rolled back. **Ask the owner before doing this.** If they decline, skip every "Commit" step that touches `GEN` and continue.

- [ ] **Step 1:** In `GEN`, create `.gitignore` containing `.DS_Store` and `__pycache__/`. Then run `git init`.
- [ ] **Step 2:** `git add -A && git commit -m "chore: baseline theme-generator"`. Run `git status --short`; expected output is empty.

### Task 1: Golden-file guard for existing themes

**Files:**
- Create: `GEN/tests/__init__.py` (empty), `GEN/tests/make_golden.py`, `GEN/tests/golden/<slug>.json` (one per existing theme), `GEN/tests/test_golden.py`

**Interfaces:**
- Consumes: `gen_themes.build(t: dict, report: list[str]) -> dict`, `palettes.THEMES`
- Produces: `tests/golden/*.json`. Every later task must keep `test_golden` passing.

- [ ] **Step 1: Write `tests/make_golden.py`.** For each `t` in `palettes.THEMES`, it writes `json.dumps(build(t, []), indent=2) + "\n"` to `tests/golden/{t['slug']}.json`, the same serialisation `write_ext` uses. Run it once **before any edit to `gen_themes.py`**: `python3 tests/make_golden.py`. Expected: 11 files in `tests/golden/`.
- [ ] **Step 2: Write the test**

```python
class GoldenTest(unittest.TestCase):
    def test_existing_themes_unchanged(self):
        for t in THEMES:
            with self.subTest(slug=t["slug"]):
                got = json.dumps(build(t, []), indent=2) + "\n"
                want = open(f"tests/golden/{t['slug']}.json").read()
                self.assertEqual(got, want)
```

- [ ] **Step 3:** Run the tests. Expected: PASS, 11 subtests.
- [ ] **Step 4: Commit** (`GEN`): `git add tests && git commit -m "test: golden output for existing themes"`

### Task 2: Extract Bootswatch variables into a vendored snapshot

**Files:**
- Create: `GEN/extract_bootswatch.py`, `GEN/bootswatch_5.3.8.json`, `GEN/tests/test_extract.py`

**Interfaces:**
- Produces:
  - `REQUIRED_VARS: list[str]`: `body-bg`, `body-color`, `primary`, `secondary`, `success`, `info`, `warning`, `danger`, `blue`, `indigo`, `purple`, `pink`, `red`, `orange`, `yellow`, `green`, `teal`, `cyan`, `white`, `black`, `gray-100` … `gray-900`.
  - `parse_root_vars(css: str) -> dict[str, str]`: reads only the **first** block whose selector starts with `:root,` (in 5.3.8 that's `:root,\n[data-bs-theme=light] {`) up to its closing `}`. Keys drop the `--bs-` prefix. 3-digit hex is expanded and all hex lowercased (`#fff` → `#ffffff`). Non-hex values such as `rgba(...)` are kept verbatim.
  - `extract(dist_dir: str) -> dict`: returns `{"version": "5.3.8", "themes": {name: {var: value}}}` for every subdirectory of `dist_dir` that has `bootstrap.css`, keeping only `REQUIRED_VARS`. Raises `ValueError(f"{theme}: missing --bs-{var}")` when one is absent.
  - CLI: `python3 extract_bootswatch.py <path/to/package/dist>` prints the JSON (`indent=1`, sorted keys) to stdout.

- [ ] **Step 1: Write the failing tests**

```python
CSS = """:root,\n[data-bs-theme=light] {\n  --bs-primary: #FFF;\n  --bs-secondary: rgba(255, 255, 255, 0.4);\n}\n[data-bs-theme=dark] {\n  --bs-primary: #000;\n}\n"""

def test_first_root_block_only(self):
    v = parse_root_vars(CSS)
    self.assertEqual(v["primary"], "#ffffff")
    self.assertEqual(v["secondary"], "rgba(255, 255, 255, 0.4)")

def test_missing_var_names_theme(self):
    # temp dir with dist/foo/bootstrap.css = CSS (lacks body-bg etc.)
    with self.assertRaisesRegex(ValueError, r"foo: missing --bs-"):
        extract(tmp)

def test_snapshot_complete(self):
    snap = json.load(open("bootswatch_5.3.8.json"))
    self.assertEqual(snap["version"], "5.3.8")
    self.assertEqual(len(snap["themes"]), 26)
    self.assertEqual(snap["themes"]["flatly"]["primary"], "#2c3e50")
    self.assertEqual(snap["themes"]["quartz"]["body-bg"], "#686dc3")
    for name, v in snap["themes"].items():
        self.assertEqual(set(v), set(REQUIRED_VARS), name)
```

- [ ] **Step 2:** Run the tests. Expected: FAIL with `ModuleNotFoundError: extract_bootswatch`.
- [ ] **Step 3:** Implement `extract_bootswatch.py` per the Interfaces block above.
- [ ] **Step 4:** Fetch Bootswatch into a fresh, empty scratch directory outside `GEN`: `npm pack bootswatch@5.3.8 && tar xzf bootswatch-5.3.8.tgz`. Then from `GEN` run `python3 extract_bootswatch.py <scratch>/package/dist > bootswatch_5.3.8.json`.
- [ ] **Step 5:** Run the tests. Expected: PASS.
- [ ] **Step 6: Commit** (`GEN`): `git add extract_bootswatch.py bootswatch_5.3.8.json tests/test_extract.py && git commit -m "feat: vendor Bootswatch 5.3.8 variables"`

### Task 3: Light-mode support and a richer report in `gen_themes.py`

**Files:**
- Modify: `GEN/gen_themes.py` (`lighten_to`, `build`)
- Test: `GEN/tests/test_light.py`

**Interfaces:**
- Produces:
  - Theme dicts may carry `mode: "light" | "dark"` (default `"dark"`) and `notes: list[str]`.
  - `build()` output `"type"` equals `t.get("mode", "dark")`.
  - `lighten_to(h, bg, target)` moves away from the background's lightness. On a light background (`lum(bg) >= 0.2`) it always darkens, even when `h` starts lighter than `bg`. On a dark background it always lightens.

Light-only changes (all behind `mode == "light"`, so golden output can't change):
- `widget.shadow`: `#00000029`
- Derived bright ANSI colours use `shift_l(v, -0.08)` instead of `+0.08`. Bright black stays `p["muted"]`.

Report changes (affect all themes; the report isn't golden-tested):
- For each text role whose final colour differs from its input, add `adjusted: <role> <in> -> <out>`.
- Mark the statusbar line `<-- LOW` when below 4.5.
- Print each entry in `t.get("notes", [])` as `note: …`.

- [ ] **Step 1: Write the failing tests**

```python
LIGHT = {**THEMES[0], "slug": "x", "label": "X", "mode": "light",
         "colors": {**THEMES[0]["colors"], "bg": "#ffffff", "bg2": "#f8f9fa",
                    "bg3": "#e9ecef", "widget": "#ffffff", "fg": "#212529",
                    "muted": "#6c757d", "comment": "#6c757d"}}

def test_light_type(self):
    self.assertEqual(build(LIGHT, [])["type"], "light")

def test_lighter_than_light_bg_darkens(self):
    out = lighten_to("#ffffff", "#d9e3f1", 4.5)
    self.assertGreaterEqual(contrast(out, "#d9e3f1"), 4.5)

def test_light_text_roles_meet_aa(self):
    p = build(LIGHT, [])["colors"]
    self.assertGreaterEqual(contrast(p["editor.foreground"], "#ffffff"), 4.5)
    self.assertLess(lum(p["terminal.ansiBrightRed"]), lum(p["terminal.ansiRed"]))

def test_report_lists_adjustments_and_notes(self):
    r = []; build({**LIGHT, "notes": ["hello"]}, r)
    self.assertTrue(any(l.strip().startswith("adjusted:") for l in r))
    self.assertIn("  note: hello", r)
```

- [ ] **Step 2:** Run the tests. Expected: `test_light` FAILs. Golden still passes.
- [ ] **Step 3:** Implement the changes listed above.
- [ ] **Step 4:** Run all tests. Expected: PASS, including `test_golden` (11 subtests).
- [ ] **Step 5: Commit** (`GEN`): `git commit -am "feat: light-mode themes and adjustment report"`

### Task 4: `bootswatch.py`, the colour formula and fallback

**Files:**
- Create: `GEN/bootswatch.py`, `GEN/tests/test_bootswatch.py`

**Interfaces:**
- Consumes: `bootswatch_5.3.8.json` (Task 2); `parse`, `hex_oklch`, `oklch_hex`, `shift_l`, `lighten_to`, `de`, `lum`, `contrast` from `gen_themes`
- Produces:
  - `CHROMA_MIN = 0.03`, `DE_MIN = 0.08`
  - `FALLBACK_HUES = ["blue", "indigo", "purple", "pink", "red", "orange", "yellow", "green", "teal", "cyan"]`
  - `resolve(v: dict, key: str) -> str`: returns hex. An `rgba(r, g, b, a)` value is alpha-composited over `v["body-bg"]`.
  - `mode_of(v: dict) -> str`: `"dark"` if `lum(body-color) > lum(body-bg)`, else `"light"`. Expected dark set: cyborg, darkly, quartz, slate, solar, superhero, vapor.
  - `bootswatch_theme(name: str, v: dict) -> dict`: a `THEMES`-format dict with `slug` `bootswatch-<name>`, `label` `Bootswatch <Name>` (`name.title()`), `description` `VS Code theme based on the Bootswatch <Name> theme`, `mode`, `colors`, `ansi`, and `notes`.
  - `BOOTSWATCH_THEMES: list[dict]`: one per snapshot theme, sorted by name. **Not** added to `palettes.THEMES`.

**Formula** (from the spec):

| Role | Source |
|---|---|
| `bg`, `fg`, `variable` | `body-bg`, `body-color` |
| `accent` | `primary`, even when it's colourless |
| `accent2` | `secondary`, or the first fallback hue with chroma ≥ `CHROMA_MIN` and `de ≥ DE_MIN` from `accent` |
| `keyword`, `string`, `function`, `type`, `number`, `property`, `regex` | `primary`, `success`, `info`, `warning`, `orange`, `purple`, `pink` |
| `tag`, `heading` / `attr` / `link` | final `keyword` / `type` / `function` |
| `error`, `warning`, `info`, `success` | `danger`, `warning`, `info`, `success` (no fallback) |
| `muted`, `comment` | `gray-600` |
| `punct`, `param` | dark: `gray-500`, `gray-400`; light: `gray-700`, `gray-700` |
| ANSI | black: dark `gray-700` / light `gray-800`; white: dark `gray-300` / light `gray-500`; red/green/yellow/blue/magenta/cyan = `red`/`green`/`yellow`/`blue`/`purple`/`cyan`, each through `lighten_to(·, bg, 4.5)` |

**Syntax fallback** (the order matters): go through roles in the order keyword, string, function, type, number, property, regex. A candidate is accepted when, after `lighten_to(c, bg, 4.5)`, its chroma is ≥ `CHROMA_MIN` and its `de` against every already-accepted syntax colour is ≥ `DE_MIN`. Otherwise, try each `FALLBACK_HUES` variable not yet used by an accepted role. If none passes, take the candidate with the largest minimum `de` among them. Record `fallback: <role> <from-var> -> <to-var>` or `fallback: <role> exhausted, using <var>` in `notes`.

**Surfaces:**
- **Dark:** `bg2` and `bg3` come from the theme's grays when a gray step has OKLCH L between `bg.L - 0.08` and `bg.L - 0.01`, and the same hue family: both chroma < 0.02, or hue within 30° and chroma ≥ half of `bg`'s. Otherwise use `shift_l(bg, -0.03)` and `shift_l(bg, -0.05)`, and note `surfaces derived from body-bg`. `widget` = `shift_l(bg, +0.05)`.
- **Light:** `bg2` and `bg3` are the first two gray steps, ascending from `gray-100`, that are darker than `bg` and in the same hue family. Otherwise use `shift_l(bg, -0.03)` and `shift_l(bg, -0.06)` with the same note (Morph). `widget` = `bg`.

- [ ] **Step 1: Write the failing tests**

```python
SNAP = json.load(open("bootswatch_5.3.8.json"))["themes"]
T = {t["slug"]: t for t in BOOTSWATCH_THEMES}

def test_all_26_and_labels(self):
    self.assertEqual(len(BOOTSWATCH_THEMES), 26)
    self.assertEqual(T["bootswatch-flatly"]["label"], "Bootswatch Flatly")

def test_modes(self):
    dark = {s for s, t in T.items() if t["mode"] == "dark"}
    self.assertEqual(dark, {f"bootswatch-{n}" for n in
        ["cyborg", "darkly", "quartz", "slate", "solar", "superhero", "vapor"]})

def test_dark_surfaces_keep_hue(self):
    c = T["bootswatch-superhero"]["colors"]
    _, _, hb = hex_oklch(c["bg"]); _, _, h2 = hex_oklch(c["bg2"])
    self.assertLess(abs(hb - h2), 5)
    self.assertLess(lum(c["bg2"]), lum(c["bg"]))

def test_colourless_primary_falls_back(self):
    t = T["bootswatch-slate"]
    self.assertEqual(t["colors"]["accent"], "#3a3f44")       # status bar keeps primary
    self.assertNotEqual(t["colors"]["keyword"], "#3a3f44")
    self.assertTrue(any(n.startswith("fallback: keyword primary ->") for n in t["notes"]))

def test_rgba_secondary_resolved(self):
    self.assertRegex(resolve(SNAP["quartz"], "secondary"), r"^#[0-9a-f]{6}$")

def test_every_theme_passes_floors(self):
    for t in BOOTSWATCH_THEMES:
        r = []; build(t, r)
        with self.subTest(t["slug"]):
            self.assertFalse([l for l in r if "LOW" in l])

def test_exhausted_fallback_still_assigns(self):
    v = {**SNAP["flatly"], **{k: "#2c3e50" for k in
         ["success", "info", "warning", "orange", "purple", "pink", *FALLBACK_HUES]}}
    t = bootswatch_theme("clash", v)
    for role in ["keyword", "string", "function", "type", "number", "property", "regex"]:
        self.assertRegex(t["colors"][role], r"^#[0-9a-f]{6}$")
    self.assertTrue(any("exhausted" in n for n in t["notes"]))
```

- [ ] **Step 2:** Run the tests. Expected: FAIL with `ModuleNotFoundError: bootswatch`.
- [ ] **Step 3:** Implement `bootswatch.py` per the formula, fallback, and surfaces above.
- [ ] **Step 4:** Run all tests. Expected: PASS. If `test_every_theme_passes_floors` fails only on the statusbar line, check that the `best_on` swap ran. Don't change the formula to make it pass; report it back instead.
- [ ] **Step 5: Commit** (`GEN`): `git add bootswatch.py tests/test_bootswatch.py && git commit -m "feat: Bootswatch palette formula with fallback"`

### Task 5: Suite writer, installer, CLI, README

**Files:**
- Modify: `GEN/gen_themes.py` (add `SUITE_DIR`, `write_suite`, `install_suite`, `register_path`; `register(t)` now calls `register_path`; extend argparse)
- Modify: `GEN/README.md` (a "Bootswatch suite" section)
- Test: `GEN/tests/test_suite.py`

**Interfaces:**
- Consumes: `BOOTSWATCH_THEMES`, `build`
- Produces:
  - `SUITE_DIR = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "narcisolobo.bootswatch-1.0.0"))`
  - `write_suite(themes: list[dict], out_dir: str) -> list[str]`: writes `themes/<name>-color-theme.json` for each (`<name>` = slug without `bootswatch-`), using the same `indent=2` + newline serialisation. Deletes any other `*-color-theme.json` in `themes/`. Writes `package.json` with the Global Constraints fields, plus `displayName` `Bootswatch Themes`, `description` `Every Bootswatch theme, ported to VS Code`, and `contributes.themes` sorted by label, each `{label, uiTheme: "vs" | "vs-dark", path: "./themes/<name>-color-theme.json"}`. Returns the written theme paths. Leaves every file outside `themes/` and `package.json` alone (`docs/`, `.git`, `.gitignore`).
  - `install_suite(out_dir: str, ext_root: str = EXT_ROOT) -> None`: symlinks `ext_root/narcisolobo.bootswatch-1.0.0` → `out_dir`. Does nothing if the link already exists and points there. Raises `SystemExit` naming the path if a real directory or a different link is in the way. Then calls `register_path("narcisolobo.bootswatch", <link path>, ext_root)`.
  - `register_path(ident: str, base: str, ext_root: str = EXT_ROOT) -> None`: the body of today's `register`, parameterised.
  - CLI: `python3 gen_themes.py --suite` reports and writes the suite. `--suite --install` also installs. The plain `--write` behaviour is unchanged and never touches Bootswatch themes.

- [ ] **Step 1: Write the failing tests** (use `tempfile.TemporaryDirectory()` for `out_dir` and `ext_root`; seed `ext_root/extensions.json` with `[]`)

```python
def test_package_json(self):
    write_suite(BOOTSWATCH_THEMES, out)
    pkg = json.load(open(f"{out}/package.json"))
    self.assertEqual((pkg["name"], pkg["publisher"], pkg["version"]), ("bootswatch", "narcisolobo", "1.0.0"))
    themes = pkg["contributes"]["themes"]
    self.assertEqual(len(themes), 26)
    flatly = next(t for t in themes if t["label"] == "Bootswatch Flatly")
    self.assertEqual(flatly["uiTheme"], "vs")
    self.assertTrue(os.path.exists(os.path.join(out, flatly["path"])))
    self.assertEqual(next(t for t in themes if t["label"] == "Bootswatch Darkly")["uiTheme"], "vs-dark")

def test_stale_theme_removed_and_docs_kept(self):
    os.makedirs(f"{out}/themes"); open(f"{out}/themes/old-color-theme.json", "w").write("{}")
    os.makedirs(f"{out}/docs"); open(f"{out}/docs/keep.md", "w").write("x")
    write_suite(BOOTSWATCH_THEMES, out)
    self.assertFalse(os.path.exists(f"{out}/themes/old-color-theme.json"))
    self.assertTrue(os.path.exists(f"{out}/docs/keep.md"))

def test_install_idempotent(self):
    install_suite(out, root); install_suite(out, root)
    data = json.load(open(f"{root}/extensions.json"))
    self.assertEqual(sum(e["identifier"]["id"] == "narcisolobo.bootswatch" for e in data), 1)
    self.assertEqual(os.path.realpath(f"{root}/narcisolobo.bootswatch-1.0.0"), os.path.realpath(out))

def test_install_refuses_real_dir(self):
    os.makedirs(f"{root}/narcisolobo.bootswatch-1.0.0")
    with self.assertRaises(SystemExit):
        install_suite(out, root)
```

- [ ] **Step 2:** Run the tests. Expected: FAIL with `ImportError: write_suite`.
- [ ] **Step 3:** Implement per the Interfaces block. Add a README section covering the extractor command, `--suite`, `--suite --install`, and "then run Developer: Reload Window".
- [ ] **Step 4:** Run all tests. Expected: PASS, golden included.
- [ ] **Step 5: Commit** (`GEN`): `git add -A && git commit -m "feat: write and install the Bootswatch suite"`

### Task 6: Generate, install, hand over for judging

- [ ] **Step 1:** Back up `~/.vscode/extensions/extensions.json` to the scratchpad. From `GEN`, run `python3 gen_themes.py --suite --install`. Expected: the report shows 26 themes with no `LOW`, and `SUITE/themes/` has 26 files.
- [ ] **Step 2:** In `SUITE`, run `git status --short`. Expected: only `package.json` and `themes/` are new.
- [ ] **Step 3: Commit** (`SUITE`): `git add package.json themes && git commit -m "feat: generate all 26 Bootswatch themes"`
- [ ] **Step 4:** Give the owner the report's `fallback:`, `adjusted:` and `note:` lines, grouped by theme. Ask them to run **Developer: Reload Window** and step through the themes in the picker. Owner-flagged fixes become per-theme overrides in a follow-up.
