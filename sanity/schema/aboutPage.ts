import { defineField, defineType } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  fields: [
    defineField({
      name: "statement",
      type: "text",
      rows: 4,
      description: "Opening paragraph on the About page.",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "farmsIntro",
      title: "Farms intro",
      type: "text",
      rows: 2,
      description: "Introductory sentence above the farm list.",
    }),
  ],
  preview: { prepare: () => ({ title: "About Page" }) },
});
