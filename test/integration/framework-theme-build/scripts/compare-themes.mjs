#!/usr/bin/env node
// Structural comparison of generated theme CSS/JSON between two dist folders
// produced by different less-openui5 variants (dist-baseline vs dist-compare):
// both are built by `ui5 build` in the generated harness (test/integration/tmp/
// framework-theme-build/); which less-openui5 each build uses is up to the
// caller (npm link it into your @ui5/cli between the two build steps).
//
// CSS is compared via its postcss AST rather than by regex/whitespace munging:
// two stylesheets are "equal" when they have the same sequence of rules,
// at-rules and declarations, where selectors/params are whitespace-normalized
// and declarations compared by exact prop + value. Comments and formatting are
// ignored. This distinguishes a genuine change (e.g. `_border-left-color` vs
// `border-left-color`) from pure formatting (a space after a comma).
//
// JSON is compared by deep structural equality of the parsed value.
//
// buildThemes only *generates* .css / *.css.json / library-parameters.json;
// .less/.png/.svg/... are copied verbatim, so we only diff .css + .json.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const postcss = require("postcss");

// The dist folders live in the generated harness dir, resolved relative to this
// script so `compare` works regardless of the caller's cwd. This file lives at
// <root>/test/integration/framework-theme-build/scripts/.
const harnessDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..", "..", "tmp", "framework-theme-build",
);
const A = join(harnessDir, "dist-baseline");
const B = join(harnessDir, "dist-compare");
const EXT = /\.(css|json)$/;

function themeFiles(root) {
  return execSync(`find ${root} -path '*/themes/*' -type f`, { maxBuffer: 1 << 30 })
    .toString().trim().split("\n")
    .filter((p) => EXT.test(p))
    .map((p) => p.slice(root.length + 1));
}

const ws = (s) => s.replace(/\s+/g, " ").trim();

// Build a whitespace-insensitive structural signature of a CSS AST. Comments
// are included (their normalized text, in document order) so any added, removed
// or changed comment — including license banners and postprocess markers — is
// reported. Selectors are split, individually normalized and re-joined so
// `a,b` == `a, b`.
function sig(node) {
  switch (node.type) {
    case "root":
      return node.nodes.map(sig);
    case "rule": {
      const selectors = node.selectors.map(ws).join(",");
      const body = node.nodes.map(sig);
      return { r: selectors, body };
    }
    case "atrule": { // cSpell:disable-line — postcss node type name
      const body = node.nodes ? node.nodes.map(sig) : null;
      return { a: node.name, p: ws(node.params), body };
    }
    case "decl":
      // prop + value kept EXACT (only internal whitespace collapsed), so the
      // underscore-hack prefix and value tokens are significant.
      return { d: ws(node.prop), v: ws(node.value), i: node.important || false };
    case "comment":
      // Include the raw left marker so a preserved `/*! ... */` banner is
      // distinguished from a plain `/* ... */` comment (postcss keeps the `!`
      // in raws.left, not in text).
      return { c: ws(node.text), m: (node.raws.left || "").replace(/\s+/g, "") };
    default:
      return { t: node.type };
  }
}

function cssSignature(text) {
  return sig(postcss.parse(text));
}

// Compare two signatures; return a short human description of the first
// difference, or null if structurally equal.
function firstDiff(a, b, path = "") {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return `${path || "root"}: node count ${a.length} vs ${b.length}`;
    }
    for (let i = 0; i < a.length; i++) {
      const d = firstDiff(a[i], b[i], `${path}[${i}]`);
      if (d) return d;
    }
    return null;
  }
  if (typeof a === "object" && a && typeof b === "object" && b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const d = firstDiff(a[k], b[k], `${path}.${k}`);
      if (d) return d;
    }
    return null;
  }
  if (a !== b) {
    return `${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
  }
  return null;
}

function deepDiff(a, b, path = "") {
  if (a === b) return null;
  if (typeof a !== typeof b) return `${path}: type ${typeof a} vs ${typeof b}`;
  if (typeof a !== "object" || a === null || b === null) {
    return `${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return `${path}: array/object mismatch`;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const d = deepDiff(a[k], b[k], `${path}/${k}`);
    if (d) return d;
  }
  return null;
}

function compare(rel) {
  const a = readFileSync(`${A}/${rel}`, "utf8");
  const b = readFileSync(`${B}/${rel}`, "utf8");
  if (rel.endsWith(".json")) {
    try {
      return deepDiff(JSON.parse(a), JSON.parse(b));
    } catch (e) {
      return a === b ? null : `JSON parse error, raw bytes differ (${e.message})`;
    }
  }
  return firstDiff(cssSignature(a), cssSignature(b));
}

const setA = new Set(themeFiles(A));
const setB = new Set(themeFiles(B));
const common = [...setA].filter((f) => setB.has(f)).sort();
const onlyA = [...setA].filter((f) => !setB.has(f)).sort();
const onlyB = [...setB].filter((f) => !setA.has(f)).sort();

const diffs = [];
for (const rel of common) {
  const d = compare(rel);
  if (d) diffs.push({ rel, d });
}

console.log(`Structural (postcss AST) comparison: ${A} vs ${B}  (themes/, *.css + *.json)\n`);
console.log(`  common files:        ${common.length}  (all compared, incl. byte-identical)`);
console.log(`  structurally equal:  ${common.length - diffs.length}`);
console.log(`  REAL differences:    ${diffs.length}`);
console.log(`  only in ${A}: ${onlyA.length}`);
console.log(`  only in ${B}:   ${onlyB.length}\n`);

if (onlyA.length) console.log("Only in A:\n  " + onlyA.join("\n  ") + "\n");
if (onlyB.length) console.log("Only in B:\n  " + onlyB.join("\n  ") + "\n");

if (diffs.length) {
  console.log("Files with REAL (structural) differences:");
  for (const { rel, d } of diffs) console.log(`  ${rel}\n      ${d}`);
  process.exitCode = 1;
} else {
  console.log("No structural differences — the two builds are semantically identical across all theme files.");
}
