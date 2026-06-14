import { defineField, defineType } from "sanity";

const navLinkChild = defineType({
  name: "navLinkChild",
  title: "Nav Link Child",
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "href",
      type: "string",
      validation: (R) => R.required(),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

const navLink = defineType({
  name: "navLink",
  title: "Nav Link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "href",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "children",
      type: "array",
      of: [{ type: "navLinkChild" }],
      description: "Optional dropdown items",
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

export const navLinksDocument = defineType({
  name: "navLinks",
  title: "Navigation Links",
  type: "document",
  fields: [
    defineField({
      name: "links",
      type: "array",
      of: [{ type: "navLink" }],
      validation: (R) => R.required().min(1),
    }),
  ],
  preview: { prepare: () => ({ title: "Navigation Links" }) },
});

export const navLinkTypes = [navLinksDocument, navLink, navLinkChild];
