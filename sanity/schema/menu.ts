import { defineType, defineField } from "sanity";

const menuItem = defineType({
  name: "menuItem",
  title: "Menu Item",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "price", type: "string" }),
    defineField({ name: "description", type: "string" }),
    defineField({ name: "note", type: "string" }),
  ],
  preview: {
    select: { title: "name", subtitle: "price" },
  },
});

const partner = defineType({
  name: "menuPartner",
  title: "Partner",
  type: "object",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({ name: "location", type: "string" }),
  ],
  preview: { select: { title: "name", subtitle: "location" } },
});

const menuSection = defineType({
  name: "menuSection",
  title: "Menu Section",
  type: "object",
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "items",
      type: "array",
      of: [{ type: "menuItem" }],
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});

export const menu = defineType({
  name: "menu",
  title: "Menu",
  type: "document",
  fields: [
    defineField({
      name: "season",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "footer_note", title: "Footer note", type: "string" }),
    defineField({
      name: "sections",
      type: "array",
      of: [{ type: "menuSection" }],
    }),
    defineField({
      name: "partnersHeading",
      title: "Partners heading",
      type: "string",
    }),
    defineField({
      name: "partners",
      title: "Partners",
      type: "array",
      of: [{ type: "menuPartner" }],
      description: "Farms and fisheries listed on the menu and About pages",
    }),
  ],
  preview: {
    select: { title: "season" },
  },
});

export const menuTypes = [menu, menuSection, menuItem, partner];
