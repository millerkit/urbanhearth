import { defineField, defineType } from "sanity";

export const chefsCounter = defineType({
  name: "chefsCounter",
  title: "Chef's Counter Menu Card",
  type: "document",
  fields: [
    defineField({
      name: "eyebrow",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "price",
      type: "string",
      validation: (R) => R.required(),
    }),
    defineField({ name: "priceLabel", type: "string" }),
    defineField({ name: "winePairingLabel", type: "string" }),
    defineField({ name: "winePairingValue", type: "string" }),
    defineField({ name: "finePrint", type: "text", rows: 2 }),
  ],
  preview: { prepare: () => ({ title: "Chef's Counter" }) },
});
