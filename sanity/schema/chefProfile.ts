import { defineField, defineType } from "sanity";

const accolade = defineType({
  name: "accolade",
  title: "Accolade",
  type: "object",
  fields: [
    defineField({
      name: "year",
      type: "string",
      description: 'e.g. "2025" or "2023–25"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "text",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "text", subtitle: "year" },
  },
});

export const chefProfile = defineType({
  name: "chefProfile",
  title: "Chef Profile",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      description: 'e.g. "Executive Chef & Owner"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "roles",
      type: "array",
      of: [{ type: "string" }],
      description: "Short descriptors shown beneath the name",
    }),
    defineField({
      name: "bio",
      type: "array",
      of: [{ type: "text" }],
      description: "One entry per paragraph",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "accolades",
      type: "array",
      of: [{ type: "accolade" }],
    }),
  ],
  // Singleton — prevent editors from creating more than one
  __experimental_actions: ["update", "publish"],
  preview: {
    select: { title: "name", subtitle: "title", media: "photo" },
  },
});

export const chefProfileTypes = [chefProfile, accolade];
