import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const english = defineCollection({
  loader: glob({ pattern: "**/english/*.{md,mdx}", base: "./src/content" }),
  schema: z.any(),
});

const french = defineCollection({
  loader: glob({ pattern: "**/french/*.{md,mdx}", base: "./src/content" }),
  schema: z.any(),
});

export const collections = {
  english,
  french,
};
