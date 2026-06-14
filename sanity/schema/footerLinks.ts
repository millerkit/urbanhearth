import { defineField, defineType } from "sanity";

export const footerLinks = defineType({
  name: "footerLinks",
  title: "Footer Links",
  type: "document",
  fields: [
    defineField({
      name: "secondaryLinks",
      type: "array",
      of: [
        {
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
        },
      ],
      description: "Links shown in the main footer nav row",
    }),
    defineField({
      name: "legalLinks",
      type: "array",
      of: [
        {
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
        },
      ],
      description:
        "Links shown in the dark footer bottom bar (legal, social, etc.)",
    }),
  ],
  preview: { prepare: () => ({ title: "Footer Links" }) },
});
