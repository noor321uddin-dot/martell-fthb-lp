import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { capture, hostMatchesSocial } = require("./attribution.js");

test("capture: extracts gclid from search string", () => {
  const b = capture("?gclid=ABC123", "", {});
  assert.equal(b.gclid, "ABC123");
});

test("capture: extracts UTM params", () => {
  const b = capture("?utm_source=google&utm_medium=cpc&utm_campaign=fthb01", "", {});
  assert.equal(b.utm_source, "google");
  assert.equal(b.utm_medium, "cpc");
  assert.equal(b.utm_campaign, "fthb01");
});

test("capture: social-referrer fallback sets utm_source=organic_social when UTMs empty and no paid click id", () => {
  const b = capture("", "https://www.instagram.com/somepost", {});
  assert.equal(b.utm_source, "organic_social");
});

test("capture: social-referrer fallback does NOT overwrite when gclid present", () => {
  const b = capture("?gclid=X", "https://instagram.com/", {});
  assert.equal(b.utm_source, undefined);
  assert.equal(b.gclid, "X");
});

test("capture: social-referrer fallback does NOT overwrite when utm_source present", () => {
  const b = capture("?utm_source=google", "https://instagram.com/", {});
  assert.equal(b.utm_source, "google");
});

test("capture: subdomain of social host recognized", () => {
  const b = capture("", "https://l.instagram.com/redirect", {});
  assert.equal(b.utm_source, "organic_social");
});

test("capture: non-social referrer does not trigger fallback", () => {
  const b = capture("", "https://randomblog.com/post", {});
  assert.equal(b.utm_source, undefined);
});

test("capture: merges with existing blob (persistence across visits)", () => {
  const b = capture("", "", { gclid: "OLD" });
  assert.equal(b.gclid, "OLD");
});

test("hostMatchesSocial: recognises facebook subdomains", () => {
  assert.equal(hostMatchesSocial("m.facebook.com"), true);
  assert.equal(hostMatchesSocial("google.com"), false);
});
