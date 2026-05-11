import { defineField, defineType } from "sanity";

export const teamMember = defineType({
  name: "teamMember",
  title: "Team Member",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "roles",
      type: "array",
      of: [{ type: "string" }],
      description: "Up to three short role labels shown beneath the photo",
    }),
    defineField({
      name: "bio",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "order", media: "photo" },
    prepare({ title, subtitle, media }) {
      return { title, subtitle: `#${subtitle}`, media };
    },
  },
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
