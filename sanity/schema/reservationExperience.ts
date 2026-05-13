import { defineField, defineType } from "sanity";

export const reservationExperience = defineType({
  name: "reservationExperience",
  title: "Reservation Experience",
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
      description: 'Display index shown on the card, e.g. "01"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      description: 'Short label above the title, e.g. "Prix Fixe"',
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
      name: "theme",
      title: "Card background",
      type: "string",
      options: {
        list: [
          { title: "Default (warm white)", value: "default" },
          { title: "Dark (midnight)", value: "dark" },
          { title: "Cream", value: "cream" },
        ],
        layout: "radio",
      },
      initialValue: "default",
    }),
    defineField({
      name: "description",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "details",
      type: "array",
      of: [{ type: "diningAreaDetail" }],
    }),
    defineField({
      name: "note",
      title: "Disclaimer note",
      type: "text",
      description: "Optional italic note shown below the detail list",
    }),
    defineField({
      name: "bookingLabel",
      title: "Booking section label",
      type: "string",
      description: 'Label above the booking widget, e.g. "Book online"',
    }),
    defineField({
      name: "otWidgetSrc",
      title: "OpenTable widget URL",
      type: "string",
      description:
        "Full script src from OpenTable (protocol-relative OK). Leave blank when phoneReserve is true.",
    }),
    defineField({
      name: "phoneReserve",
      title: "Phone/email reservation",
      type: "boolean",
      initialValue: false,
      description:
        "When true, shows phone and email contact instead of the OpenTable widget",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "eyebrow" },
  },
  orderings: [
    {
      title: "Display order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
});
