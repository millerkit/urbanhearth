import { defineField, defineType } from "sanity";

export const reservationExperience = defineType({
  name: "reservationExperience",
  title: "Reservation Experience",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "number",
      type: "string",
      description: 'Display index shown on the card, e.g. "01"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      description: 'Short label above the title, e.g. "Chef\'s Tasting Menu"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "id",
      title: "Anchor ID",
      type: "slug",
      description: "Used for #anchor links — e.g. dining-room",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "details",
      type: "array",
      of: [{ type: "diningOptionDetail" }],
    }),
    defineField({
      name: "note",
      title: "Disclaimer note",
      type: "text",
      description: "Optional italic note shown below the detail list",
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
