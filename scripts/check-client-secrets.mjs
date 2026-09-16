import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const roots = process.argv.slice(2);
if (!roots.length) roots.push("dist");
const patterns = [/AIza[0-9A-Za-z_-]{35}/, /VITE_GEMINI_API_KEY/, /generativelanguage\.googleapis\.com/, /RALLYTRACK_BUILD_SECRET_SENTINEL/];
let failures = 0;
async function scan(path) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const name = join(path, entry.name);
    if (entry.isDirectory()) await scan(name);
    else {
      const content = (await readFile(name)).toString();
      if (!patterns.some((pattern) => pattern.test(content))) continue;
      // Filename only: never echo a matched credential.
      console.error(`Forbidden client secret/provider reference in ${name}`);
      failures++;
    }
  }
}
for (const root of roots) await scan(root);
if (failures) process.exit(1);
console.log("Client secret scan passed");
