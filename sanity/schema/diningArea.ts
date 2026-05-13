import { defineField, defineType } from "sanity";

const diningAreaDetail = defineType({
  name: "diningAreaDetail",
  title: "Detail row",
  type: "object",
  fields: [
    defineField({
      name: "label",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      type: "string",
      description:
        "Leave blank when linkType is set — value is pulled from Site Settings",
    }),
    defineField({
      name: "linkType",
      title: "Link type",
      type: "string",
      options: {
        list: [
          { title: "None", value: "none" },
          { title: "Email (private dining)", value: "email" },
          { title: "Phone", value: "phone" },
        ],
        layout: "radio",
      },
      initialValue: "none",
      description:
        "When set to Email or Phone, links to the value in Site Settings",
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "value" },
  },
});

export const diningArea = defineType({
  name: "diningArea",
  title: "Dining Area",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "number",
      type: "string",
      description: 'Display index shown on the photo label, e.g. "01"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      description: 'Eyebrow label, e.g. "À La Carte"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "id",
      title: "Anchor ID",
      type: "slug",
      description: "Used for #anchor links — e.g. dining-room",
      options: { source: "title" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "dark",
      title: "Dark background",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "photo",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "photoAlt",
      title: "Photo alt text",
      type: "string",
    }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "text" }],
      description: "One entry per paragraph",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "details",
      type: "array",
      of: [{ type: "diningAreaDetail" }],
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA label",
      type: "string",
      description: "Label for the reservation button",
    }),
    defineField({
      name: "phoneReserve",
      title: "Phone reservation",
      type: "boolean",
      initialValue: false,
      description:
        "When true, shows phone/email contact instead of a reservation button",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "label", media: "photo" },
  },
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});

export const diningAreaTypes = [diningArea, diningAreaDetail];
