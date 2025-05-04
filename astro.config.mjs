import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import AutoImport from "astro-auto-import";
import { defineConfig } from "astro/config";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import config from "./src/config/config.json";
import languagesJSON from "./src/config/language.json";
// import cloudflare from "@astrojs/cloudflare";

const { default_language } = config.settings;
const { default_language_in_subdir } = config.settings;

const supportedLang = [...languagesJSON.map((lang) => lang.languageCode)];
const disabledLanguages = config.settings.disable_languages;

// Filter out disabled languages from supportedLang
const filteredSupportedLang = supportedLang.filter(
  (lang) => !disabledLanguages.includes(lang),
);

// https://astro.build/config
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "https://www.location-maison-mer.fr",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: 'always',
  outDir: './dist',
  i18n: {
    locales: filteredSupportedLang,
    defaultLocale: default_language,
    routing: {
      prefixDefaultLocale: true //default_language_in_subdir
    }
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        // Vous pouvez ajouter des configurations spécifiques pour Sharp ici si nécessaire
        limitInputPixels: false,
      },
    },
  },
  integrations: [
    react(),
    sitemap({
      filter: (url) => {
        // Inclure uniquement les fichiers sous /fr/ et /en/
        return url.includes('/fr/') || url.includes('/en/');
      },
    }),
    tailwind({
      applyBaseStyles: false,
    }),
    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [
      remarkToc,
      [
        remarkCollapse,
        {
          test: "Table of contents",
        },
      ],
    ],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
    extendDefaultPlugins: true,
  },
  output: "static",
});
