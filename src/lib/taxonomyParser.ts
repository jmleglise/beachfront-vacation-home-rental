import config from "@/config/config.json";
import languages from "@/config/language.json";
import { slugify } from "@/lib/utils/textConverter";
import type { ContentEntryMap } from "astro:content";
import { getCollection } from "astro:content";

const resolveContentDir = (collection: string) => {
  const { default_language } = config.settings;
  const language = languages.find((l) => l.languageCode === collection);
  if (language) return language.contentDir;
  const fallback = languages.find((l) => l.languageCode === default_language);
  return fallback ? fallback.contentDir : "french";
};

export const getTaxonomy = async (collection: string, name: string) => {
  const actualCollection = resolveContentDir(collection);
  const singlePages = await getCollection(
    actualCollection as keyof ContentEntryMap,
    ({ id }: any) => id.startsWith("blog/") && !id.endsWith("/-index") && !id.endsWith("-index"),
  );

  const taxonomyPages = singlePages.map((page: any) => page.data[name]);
  const taxonomies: string[] = [];
  for (const categoryArray of taxonomyPages) {
    if (!Array.isArray(categoryArray)) continue;
    for (const item of categoryArray) taxonomies.push(slugify(item));
  }
  return [...new Set(taxonomies)];
};

export const getAllTaxonomy = async (collection: string, name: string) => {
  const actualCollection = resolveContentDir(collection);
  const singlePages = await getCollection(
    actualCollection as keyof ContentEntryMap,
    ({ id }: any) => id.startsWith("blog/") && !id.endsWith("/-index") && !id.endsWith("-index"),
  );

  const taxonomyPages = singlePages.map((page: any) => page.data[name]);
  const taxonomies: string[] = [];
  for (const categoryArray of taxonomyPages) {
    if (!Array.isArray(categoryArray)) continue;
    for (const item of categoryArray) taxonomies.push(slugify(item));
  }
  return taxonomies;
};
