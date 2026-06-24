import { defineField, defineType } from "sanity";

export const faqItem = defineType({
  name: "faqItem",
  title: "FAQ Item",
  type: "document",
  fields: [
    defineField({
      name: "question",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "answer",
      type: "text",
      rows: 6,
      description: "Separate paragraphs with a blank line.",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "mapUrl",
      title: "Map link URL",
      type: "url",
      description:
        "Optional. Renders as a 'View on Google Maps' link below the answer.",
    }),
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      description: "Lower numbers appear first.",
      validation: (R) => R.required().integer().min(0),
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "question", subtitle: "order" },
    prepare: ({ title, subtitle }) => ({ title, subtitle: `#${subtitle}` }),
  },
});
