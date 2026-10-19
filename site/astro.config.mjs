import { defineConfig } from "astro/config";
import { SITE } from "./site.config.mjs";

export default defineConfig({
  site: `https://${SITE.owner}.github.io`,
  base: `/${SITE.repo}/`,
  output: "static",
});
