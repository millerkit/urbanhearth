import { defineField, defineType } from "sanity";

export const reservationsPage = defineType({
  name: "reservationsPage",
  title: "Reservations Page",
  type: "document",
  fields: [
    defineField({
      name: "pageTitle",
      title: "Page title",
      type: "string",
      validation: (R) => R.required(),
      initialValue: "Reserve",
    }),
    defineField({
      name: "pageLead",
      title: "Lead paragraph",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 2,
    }),
  ],
  preview: { prepare: () => ({ title: "Reservations Page" }) },
});
