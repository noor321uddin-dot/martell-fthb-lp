import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
// Shim minimal window/document for form.js to load in Node
globalThis.window = {};
globalThis.document = { readyState: "complete", addEventListener: () => {}, getElementById: () => null, querySelector: () => null };
const require = createRequire(import.meta.url);
const { uuidv4 } = require("./form.js");

test("uuidv4: produces a valid RFC 4122 v4 UUID string", () => {
  const id = uuidv4();
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("uuidv4: produces unique IDs across 1000 calls", () => {
  const s = new Set();
  for (let i = 0; i < 1000; i++) s.add(uuidv4());
  assert.equal(s.size, 1000);
});
