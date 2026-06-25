import { defineField, defineType } from "sanity";

export const menusPage = defineType({
  name: "menusPage",
  title: "Menus Page",
  type: "document",
  fields: [
    defineField({
      name: "pageLead",
      title: "Page lead",
      type: "string",
      description: "Introductory sentence shown below the À la Carte heading.",
    }),
    defineField({
      name: "accuracyNote",
      title: "Accuracy note",
      type: "string",
      description: "Italicized disclaimer shown below the page header.",
    }),
    defineField({
      name: "walkInsNote",
      title: "Walk-ins note",
      type: "string",
      description:
        "Short line shown in the dining room header on the menu card.",
    }),
  ],
  preview: { prepare: () => ({ title: "Menus Page" }) },
});
