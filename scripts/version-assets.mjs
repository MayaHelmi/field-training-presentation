import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function assetVersion(relativePath) {
  const contents = await readFile(path.join(root, relativePath));
  return createHash("sha256").update(contents).digest("hex").slice(0, 10);
}

async function updateReferences(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  const original = await readFile(filePath, "utf8");
  const updated = replacements.reduce(
    (contents, { asset, version }) =>
      contents.replaceAll(
        new RegExp(`${asset.replaceAll(".", "\\.")}(?:\\?v=[^\"]+)?`, "g"),
        `${asset}?v=${version}`,
      ),
    original,
  );

  if (updated !== original) await writeFile(filePath, updated);
}

const cssVersion = await assetVersion("assets/css/styles.css");
const javascriptVersion = await assetVersion("assets/js/main.js");

await updateReferences("index.html", [
  { asset: "assets/css/styles.css", version: cssVersion },
  { asset: "assets/js/main.js", version: javascriptVersion },
]);
await updateReferences("404.html", [
  { asset: "assets/css/styles.css", version: cssVersion },
]);

console.log(`Versioned CSS ${cssVersion} and JavaScript ${javascriptVersion}.`);
