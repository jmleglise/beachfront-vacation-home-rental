import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = "https://www.location-maison-mer.fr";

// Les pages de taxonomie sont en noindex (contenu mince, descriptions
// dupliquees) : les declarer dans le sitemap enverrait un signal contradictoire.
const EXCLUDED = /\/(tags|categories)\//;

// Dates reelles de publication, lues dans le frontmatter des articles.
// On ne declare un <lastmod> que pour les URLs dont on connait vraiment la
// date : Google ignore le champ des qu'il le juge peu fiable, et l'ancienne
// version annoncait "tout le site modifie" a chaque deploiement.
function collectPostDates(projectRoot) {
  const dates = new Map();
  const langByDir = { french: "fr", english: "en" };

  for (const [dirName, lang] of Object.entries(langByDir)) {
    const dir = path.join(projectRoot, "src", "content", "blog", dirName);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".md") || file.startsWith("-index")) continue;
      const frontmatter = fs.readFileSync(path.join(dir, file), "utf-8").split("---")[1] || "";
      const match = frontmatter.match(/^date:\s*(\S+)/m);
      if (!match) continue;
      const date = new Date(match[1]);
      if (Number.isNaN(date.getTime())) continue;
      dates.set(`/${lang}/blog/${file.replace(/\.md$/, "")}/`, date);
    }
  }
  return dates;
}

export default function sitemapPlugin() {
  return {
    name: "custom-sitemap",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const distPath = fileURLToPath(dir);
        const postDates = collectPostDates(process.cwd());
        const entries = [];

        function walk(dirPath) {
          for (const file of fs.readdirSync(dirPath)) {
            const fullPath = path.join(dirPath, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
              walk(fullPath);
              continue;
            }
            if (file !== "index.html") continue;

            const relativePath = path
              .relative(distPath, fullPath)
              .replace(/index\.html$/, "");
            const url = "/" + relativePath.replace(/\\/g, "/");

            // garder uniquement fr/en
            if (!/^\/(fr|en)(\/|$)/.test(url)) continue;
            if (EXCLUDED.test(url)) continue;

            // Une page en noindex n'a rien a faire dans un sitemap.
            const html = fs.readFileSync(fullPath, "utf-8");
            if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) continue;

            entries.push({ url: encodeURI(url), lastmod: postDates.get(url) });
          }
        }

        walk(distPath);

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ url, lastmod }) => `
  <url>
    <loc>${BASE}${url}</loc>${
      lastmod ? `
    <lastmod>${lastmod.toISOString().split("T")[0]}</lastmod>` : ""
    }
  </url>`,
  )
  .join("")}
</urlset>`;

        fs.writeFileSync(path.join(distPath, "sitemap-0.xml"), xml);

        const dated = entries.filter((entry) => entry.lastmod).length;
        console.log(
          `✅ sitemap généré : ${entries.length} urls (${dated} avec lastmod)`,
        );
      },
    },
  };
}
