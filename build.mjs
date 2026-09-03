// Inlines src/js/*.js into public/index.html -> a single self-contained file
// for GHL custom-code paste (GHL can't load external /js/ files).
// Run: node build.mjs   (stdlib only, no deps)
// The template public/index.html keeps <script src="/js/NAME.js"> as markers;
// this is the ONLY place the deployable artifact is generated, so it never goes stale.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const tpl = readFileSync(join(root, "public/index.html"), "utf8");

const out = tpl.replace(
  /<script src="\/js\/([\w-]+)\.js"[^>]*><\/script>/g,
  (_, name) => "<script>\n" + readFileSync(join(root, "src/js", name + ".js"), "utf8") + "\n</script>"
);

// Fail loudly if a launch-blocker survives into the shippable file.
for (const bad of ['src="/js/', "META_PIXEL_ID", "TURNSTILE_SITE_KEY", "[range]", "[CANONICAL_URL]"]) {
  if (out.includes(bad)) throw new Error(`build: leftover "${bad}" in output — fix the source, do not ship`);
}
// GTM owns the Meta pixel; no inline fbq init/Lead (both double-fire).
if (/fbq\(\s*['"](?:init|track)['"]\s*,\s*['"](?:\d|Lead)/.test(out)) {
  throw new Error("build: inline fbq init/Lead in output — GTM owns the pixel, remove it");
}

mkdirSync(join(root, "dist"), { recursive: true });
writeFileSync(join(root, "dist/martell-fthb-lp-ghl-paste.html"), out);
writeFileSync(join(root, "public/_preview.html"), out);          // local browser check (gitignored)
writeFileSync(join(root, "../martell-fthb-lp-ghl-paste.html"), out); // refresh the known sibling path
console.log(`built dist/martell-fthb-lp-ghl-paste.html (${out.length} bytes)`);
