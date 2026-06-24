import { defineField, defineType } from "sanity";

const partnerItem = defineType({
  name: "partnerItem",
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

export const partners = defineType({
  name: "partners",
  title: "Partners",
  type: "document",
  fields: [
    defineField({ name: "heading", type: "string" }),
    defineField({
      name: "items",
      type: "array",
      of: [{ type: "partnerItem" }],
      description: "Farms and fisheries listed on the About page",
    }),
  ],
  preview: { prepare: () => ({ title: "Partners" }) },
});

export const partnerTypes = [partners, partnerItem];
