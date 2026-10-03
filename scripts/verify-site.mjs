import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parseHTML } from "linkedom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = ["index.html", "404.html"];
const failures = [];
const referencedAssets = new Set();

function fail(message) {
  failures.push(message);
}

async function versionFor(relativePath) {
  const contents = await readFile(path.join(root, relativePath));
  return createHash("sha256").update(contents).digest("hex").slice(0, 10);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

for (const htmlFile of htmlFiles) {
  const html = await readFile(path.join(root, htmlFile), "utf8");
  const { document } = parseHTML(html);
  const ids = new Set();

  for (const element of document.querySelectorAll("[id]")) {
    if (ids.has(element.id)) fail(`${htmlFile}: duplicate id ${element.id}`);
    ids.add(element.id);
  }

  if (document.querySelector("style, [style]")) {
    fail(`${htmlFile}: custom inline CSS found`);
  }

  for (const image of document.querySelectorAll("img")) {
    if (!image.hasAttribute("alt")) fail(`${htmlFile}: image without alt`);
  }

  for (const link of document.querySelectorAll('a[target="_blank"]')) {
    const rel = (link.getAttribute("rel") ?? "").split(/\s+/);
    if (!rel.includes("noopener")) {
      fail(`${htmlFile}: target=_blank link without noopener`);
    }
  }

  for (const element of document.querySelectorAll("[src], [href]")) {
    const rawReference =
      element.getAttribute("src") ?? element.getAttribute("href");
    if (
      !rawReference ||
      rawReference.startsWith("#") ||
      rawReference.startsWith("data:") ||
      /^[a-z]+:/i.test(rawReference)
    ) {
      continue;
    }

    const relativeReference = rawReference.split(/[?#]/, 1)[0];
    if (relativeReference === "./") continue;
    const normalizedReference = relativeReference.replace(/^\//, "");
    const targetPath = path.join(root, normalizedReference);

    try {
      if (!(await stat(targetPath)).isFile()) {
        fail(`${htmlFile}: reference is not a file: ${rawReference}`);
      }
    } catch {
      fail(`${htmlFile}: missing local reference: ${rawReference}`);
    }

    if (normalizedReference.startsWith("assets/")) {
      referencedAssets.add(normalizedReference);
    }
  }
}

for (const assetPath of await listFiles(path.join(root, "assets"))) {
  const relativePath = path.relative(root, assetPath);
  if (!referencedAssets.has(relativePath))
    fail(`Unused asset: ${relativePath}`);
}

const indexHtml = await readFile(path.join(root, "index.html"), "utf8");
const notFoundHtml = await readFile(path.join(root, "404.html"), "utf8");
const cssVersion = await versionFor("assets/css/styles.css");
const javascriptVersion = await versionFor("assets/js/main.js");

if (!indexHtml.includes(`assets/css/styles.css?v=${cssVersion}`)) {
  fail("index.html: stale CSS cache version");
}
if (!notFoundHtml.includes(`assets/css/styles.css?v=${cssVersion}`)) {
  fail("404.html: stale CSS cache version");
}
if (!indexHtml.includes(`assets/js/main.js?v=${javascriptVersion}`)) {
  fail("index.html: stale JavaScript cache version");
}

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Site verification passed.");
}
