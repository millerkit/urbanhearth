import { defineType, defineField } from "sanity";

const packageDetail = defineType({
  name: "packageDetail",
  title: "Package Detail",
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "value" },
  },
});

export const privateEventPackage = defineType({
  name: "private_event_package",
  title: "Private Event Package",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "details",
      type: "array",
      of: [{ type: "packageDetail" }],
    }),
    defineField({
      name: "note",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "dark",
      title: "Dark background",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "eyebrow" },
  },
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});

export const privateEventTypes = [privateEventPackage, packageDetail];
