import { z } from 'zod';

export const CONTENT_TYPES = [
  'species',
  'class',
  'archetype',
  'background',
  'feat',
  'fighting_style',
  'force_power',
  'tech_power',
  'maneuver',
  'weapon',
  'armor',
  'equipment',
  'enhanced_item',
  'consumable',
  'creature',
  'npc',
  'condition',
  'starship',
  'deployment',
  'venture',
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];
export const contentTypeSchema = z.enum(CONTENT_TYPES);

export const contentOriginSchema = z.enum(['bundled', 'user_import', 'homebrew']);
export type ContentOrigin = z.infer<typeof contentOriginSchema>;

export const contentPackSchema = z.object({
  id: z.string().min(1),
  namespace: z.string().regex(/^[a-z0-9_-]+:[a-z0-9_-]+$/),
  name: z.string().min(1),
  publisher: z.string().min(1),
  rulesVersion: z.string().min(1),
  dataVersion: z.string().min(1),
  licenseId: z.string().min(1),
  attribution: z.string().min(1),
  sourceUrl: z.string().default(''),
  origin: contentOriginSchema,
});
export type ContentPack = z.infer<typeof contentPackSchema>;

export const contentEntrySchema = z.object({
  id: z.string().min(1),
  packId: z.string().min(1),
  slug: z.string().min(1),
  contentType: contentTypeSchema,
  name: z.string().min(1),
  summary: z.string().default(''),
  description: z.string().default(''),
  prerequisitesJson: z.string().default('{}'),
  propertiesJson: z.string().default('{}'),
  sourceRef: z.string().min(1),
  rulesVersion: z.string().min(1),
  dataVersion: z.string().min(1),
  attribution: z.string().default('SW5e Community'),
  isCustom: z.boolean().default(false),
});
export type ContentEntry = z.infer<typeof contentEntrySchema>;

export const contentBundleSchema = z.object({
  pack: contentPackSchema,
  entries: z.array(contentEntrySchema),
});
export type ContentBundle = z.infer<typeof contentBundleSchema>;
