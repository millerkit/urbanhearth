import { defineField, defineType } from "sanity";

export const mailingListPage = defineType({
  name: "mailingListPage",
  title: "Mailing List Page",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      description: "Small label above the page title.",
      initialValue: "Stay in Touch",
    }),
    defineField({
      name: "pageTitle",
      title: "Page title",
      type: "string",
      validation: (R) => R.required(),
      initialValue: "Join Our Mailing List",
    }),
    defineField({
      name: "pageLead",
      title: "Lead paragraph",
      type: "text",
      rows: 3,
      description: "Displayed below the title in the page header.",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "submitLabel",
      title: "Submit button label",
      type: "string",
      initialValue: "Join the List",
    }),
    defineField({
      name: "successEyebrow",
      title: "Success eyebrow",
      type: "string",
      description: "Small label shown after a successful signup.",
      initialValue: "You're on the list",
    }),
    defineField({
      name: "successMessage",
      title: "Success message",
      type: "text",
      rows: 2,
      description: "Shown below the success eyebrow after signup.",
    }),
  ],
  preview: { prepare: () => ({ title: "Mailing List Page" }) },
});
