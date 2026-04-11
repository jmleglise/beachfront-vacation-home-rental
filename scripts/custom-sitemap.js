import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export default function sitemapPlugin() {
  return {
    name: "custom-sitemap",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // ⚠️ IMPORTANT : utiliser dir correctement
        const distPath = fileURLToPath(dir);

        console.log("📂 distPath:", distPath);

        const urls = [];

        function walk(dirPath) {
          const files = fs.readdirSync(dirPath);

          for (const file of files) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              walk(fullPath);
            } else if (file === "index.html") {
              const relativePath = path
                .relative(distPath, fullPath)
                .replace(/index\.html$/, "");

              let url = "/" + relativePath.replace(/\\/g, "/");

              // garder uniquement fr/en
              if (!/^\/(fr|en)(\/|$)/.test(url)) continue;

              // encoder URL correctement
              url = encodeURI(url);

              urls.push(url);
            }
          }
        }

        walk(distPath);

        console.log("🔎 URLs trouvées:", urls.length);

        const base = "https://www.location-maison-mer.fr";

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `
  <url>
    <loc>${base}${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>`
  )
  .join("")}
</urlset>`;

        fs.writeFileSync(path.join(distPath, "sitemap-0.xml"), xml);

        console.log(`✅ sitemap généré : ${urls.length} urls`);
      },
    },
  };
}