// Guards the lead-capture contract in public/index.html.
// These are markup/config invariants that silently break lead flow when violated —
// no DOM needed, so they run in the same `npm test` as the unit tests.
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../../public/index.html", import.meta.url), "utf8");

test("hero-b is hidden by attribute, not an unconditional rule", () => {
  // `#hero-b{display:none}` outranks the `hidden` attribute the JS toggles,
  // so ?v=search rendered an empty hero.
  assert.ok(html.includes("#hero-b[hidden]{display:none}"), "CSS must be attribute-scoped");
  assert.ok(!/#hero-b\{display:none\}/.test(html), "unconditional rule must not return");
  assert.match(html, /<div id="hero-b"[^>]*\shidden>/, "markup must start hidden (no pre-JS flash)");
});

test("qualifier form posts first_name, matching GHL", () => {
  assert.match(html, /id="gq-name"[^>]*name="first_name"/);
  assert.ok(!/id="gq-name"[^>]*name="name"/.test(html));
});

test("attribution copy loop carries variant and both click ids", () => {
  const loop = html.match(/\[("(?:page_url|page_variant|gclid|gbraid|wbraid|fbclid|utm_\w+|test_lead)",?)+\]/);
  assert.ok(loop, "copy loop not found");
  for (const key of ["page_variant", "fbclid", "gclid"]) {
    assert.ok(loop[0].includes(`"${key}"`), `${key} missing from copy loop`);
  }
});

test("both forms carry the fields the loop copies", () => {
  for (const name of ["page_variant", "fbclid"]) {
    const hits = html.match(new RegExp(`name="${name}"`, "g")) || [];
    assert.strictEqual(hits.length, 2, `expected ${name} on qualifier + main form`);
  }
});

test("no visitor-facing placeholders or launch-blockers ship", () => {
  // [phone]/GTM = visible junk; the rest silently break lead flow or tracking.
  for (const ph of ["[phone]", "GTM-XXXXXXX", "[range]", "[CANONICAL_URL]", "META_PIXEL_ID", "TURNSTILE_SITE_KEY"]) {
    assert.ok(!html.includes(ph), `${ph} still present`);
  }
});

test("Meta pixel is loaded once (via GTM) — no inline re-init that double-fires PageView", () => {
  assert.ok(!/fbq\(\s*['"]init['"]/.test(html), "inline fbq('init') re-inits the GTM pixel → duplicate PageView");
});

test("neither form gates submit on a Turnstile token (no valid sitekey at launch)", () => {
  assert.ok(!html.includes("turnstile-container"), "Turnstile mount left in markup");
  assert.ok(!/complete the security check/i.test(html), "Turnstile token gate still blocks submit");
});
