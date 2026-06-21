import { defineField, defineType } from "sanity";

export const teamPage = defineType({
  name: "teamPage",
  title: "Team Page",
  type: "document",
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "pageTitle",
      title: "Page title",
      type: "string",
      initialValue: "The Team",
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
    defineField({
      name: "chefLinkText",
      title: "Chef intro line",
      type: "string",
      description:
        'Use {chefLink} as a placeholder for the linked chef name — e.g. "Led by {chefLink}, Executive Chef & Owner."',
      initialValue: "Led by {chefLink}, Executive Chef & Owner.",
    }),
  ],
  preview: { prepare: () => ({ title: "Team Page" }) },
});
