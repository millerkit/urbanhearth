import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Restaurant name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "tagline",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "url",
      title: "Site URL",
      type: "url",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "address",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "phone",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "hours",
      type: "array",
      of: [{ type: "string" }],
      description:
        'Each entry is one line of hours text, e.g. "Tuesday – Sunday: 5:00 — 10:00 pm"',
    }),
    defineField({
      name: "privateDiningEmail",
      title: "Private dining email",
      type: "string",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "reservations",
      type: "object",
      fields: [
        defineField({
          name: "label",
          type: "string",
          description: '"Full label, e.g. Make a reservation"',
        }),
        defineField({
          name: "shortLabel",
          type: "string",
          description: 'Short label for top bar CTA, e.g. "Reserve"',
        }),
        defineField({
          name: "href",
          type: "string",
          description: 'Path or URL, e.g. "/reservations"',
        }),
      ],
    }),
    defineField({
      name: "social",
      type: "object",
      fields: [
        defineField({ name: "instagram", type: "url" }),
        defineField({ name: "facebook", type: "url" }),
      ],
    }),
  ],
});
