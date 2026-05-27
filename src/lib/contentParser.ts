import { getCollection, type CollectionEntry, type ContentEntryMap } from "astro:content";
import config from "@/config/config.json";
import languages from "@/config/language.json";

const resolveContentDir = (lang: keyof ContentEntryMap | undefined) => {
  const { default_language } = config.settings;
  const selectedLanguageCode = lang || default_language;
  const language = languages.find((l: any) => l.languageCode === selectedLanguageCode);
  if (!language) throw new Error("Language not found");
  return language.contentDir;
};

const removeDrafts = (pages: any[]) => pages.filter((data) => !data?.data?.draft);

export const getSP = async (
  collectionName: string,
  lang: keyof ContentEntryMap | undefined,
): Promise<CollectionEntry<any>[]> => {
  const contentDir = resolveContentDir(lang);
  const pages = await getCollection(contentDir as any, ({ id }: any) =>
    id.startsWith(`${collectionName}/${contentDir}`) && !id.endsWith("/-index") && !id.endsWith("-index"),
  );
  return removeDrafts(pages) as CollectionEntry<any>[];
};

export const getLP = async (
  collectionName: string,
  lang: keyof ContentEntryMap | undefined,
): Promise<CollectionEntry<any>[]> => {
  const contentDir = resolveContentDir(lang);
  return (await getCollection(contentDir as any, ({ id }: any) => id.startsWith(`${collectionName}/${contentDir}`))) as CollectionEntry<any>[];
};

export const getSinglePage = async (
  collectionName: string,
  lang: keyof ContentEntryMap | undefined,
  subCollectionName?: string,
): Promise<CollectionEntry<any>[]> => {
  const contentDir = resolveContentDir(lang);
  const path = subCollectionName ? `${collectionName}/${contentDir}/${subCollectionName}` : `${collectionName}/${contentDir}`;
  const pages = await getCollection(contentDir as any, ({ id }: any) =>
    id.startsWith(path) && !id.endsWith("/-index") && !id.endsWith("-index"),
  );
  return removeDrafts(pages) as CollectionEntry<any>[];
};

export const getListPage = async (
  collectionName: string,
  lang: keyof ContentEntryMap | undefined,
): Promise<CollectionEntry<any>[]> => {
  const contentDir = resolveContentDir(lang);
  return (await getCollection(contentDir as any, ({ id }: any) => id.startsWith(`${collectionName}/${contentDir}`))) as CollectionEntry<any>[];
};
