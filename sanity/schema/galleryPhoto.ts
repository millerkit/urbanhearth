import { defineField, defineType } from "sanity";

export const galleryPhoto = defineType({
  name: "galleryPhoto",
  title: "Gallery Photo",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "span",
      title: "Grid span",
      type: "string",
      options: {
        list: [
          { title: "Normal (1 column)", value: "normal" },
          { title: "Wide (2 columns)", value: "wide" },
          { title: "Full (3 columns)", value: "full" },
        ],
        layout: "radio",
      },
      initialValue: "normal",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "alt", subtitle: "span", media: "photo" },
  },
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
