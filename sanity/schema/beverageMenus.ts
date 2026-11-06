import { defineType, defineField } from "sanity";

const curatedBy = defineField({
  name: "curatedBy",
  title: "Curated by",
  type: "array",
  of: [{ type: "string" }],
  description: 'One line per person, e.g. "Katie Janik, wine director".',
});

const priced = (name: string, title: string, description?: string) =>
  defineField({ name, title, type: "string", description });

const wineItem = defineType({
  name: "wineItem",
  title: "Wine",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "region", type: "string" }),
    defineField({
      name: "description",
      type: "string",
      description: "Grape(s) — tasting notes",
    }),
    priced("price", "Price", 'Glass | Bottle, e.g. "16 | 70"'),
  ],
  preview: { select: { title: "name", subtitle: "price" } },
});

const wineSection = defineType({
  name: "wineSection",
  title: "Wine Section",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "items", type: "array", of: [{ type: "wineItem" }] }),
  ],
  preview: { select: { title: "title" } },
});

export const wineMenu = defineType({
  name: "wineMenu",
  title: "Wine Menu",
  type: "document",
  fields: [
    curatedBy,
    defineField({ name: "footerNote", title: "Footer note", type: "string" }),
    defineField({
      name: "sections",
      type: "array",
      of: [{ type: "wineSection" }],
    }),
  ],
  preview: { prepare: () => ({ title: "Wine Menu" }) },
});

const simpleDrink = defineType({
  name: "simpleDrink",
  title: "Drink",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", type: "string" }),
    defineField({
      name: "nonAlcoholic",
      title: "Non-alcoholic",
      type: "boolean",
      description:
        "Non-alcoholic cocktails appear under Zero Proof instead of Cocktails.",
    }),
  ],
  preview: { select: { title: "name", subtitle: "description" } },
});

const spiritItem = defineType({
  name: "spiritItem",
  title: "Spirit",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    priced("price", "Price"),
  ],
  preview: { select: { title: "name", subtitle: "price" } },
});

const spiritSection = defineType({
  name: "spiritSection",
  title: "Spirit Category",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "items", type: "array", of: [{ type: "spiritItem" }] }),
  ],
  preview: { select: { title: "title" } },
});

const beerItem = defineType({
  name: "beerItem",
  title: "Beer / Cider",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "brewery",
      title: "Brewery, location",
      type: "string",
    }),
    priced("price", "Price"),
    defineField({
      name: "format",
      type: "string",
      description:
        'Groups the beer page, e.g. "On Tap", "Packaged", "Spirit Free Brews". Groups appear in order of first use.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", type: "string" }),
    defineField({
      name: "nonAlcoholic",
      title: "Non-alcoholic",
      type: "boolean",
    }),
  ],
  preview: { select: { title: "name", subtitle: "format" } },
});

export const spiritsMenu = defineType({
  name: "spiritsMenu",
  title: "Spirits, Cocktails & Beer Menu",
  type: "document",
  fields: [
    curatedBy,
    defineField({
      name: "cocktailPrice",
      type: "string",
      description: "Single price shared by all house cocktails.",
    }),
    defineField({
      name: "cocktails",
      type: "array",
      of: [{ type: "simpleDrink" }],
      description: "House cocktails and zero-proof drinks (flag the latter).",
    }),
    defineField({ name: "zeroProofPrice", type: "string" }),
    defineField({ name: "smallFormatPrice", type: "string" }),
    defineField({
      name: "smallFormat",
      type: "array",
      of: [{ type: "simpleDrink" }],
    }),
    defineField({
      name: "spiritsSections",
      title: "Spirits",
      type: "array",
      of: [{ type: "spiritSection" }],
    }),
    defineField({
      name: "beer",
      title: "Beer & cider",
      type: "array",
      of: [{ type: "beerItem" }],
    }),
  ],
  preview: { prepare: () => ({ title: "Spirits, Cocktails & Beer" }) },
});

export const beverageMenuTypes = [
  wineMenu,
  wineSection,
  wineItem,
  spiritsMenu,
  spiritSection,
  spiritItem,
  simpleDrink,
  beerItem,
];
