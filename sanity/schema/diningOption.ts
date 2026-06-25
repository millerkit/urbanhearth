import { defineField, defineType } from "sanity";

const diningOptionDetail = defineType({
  name: "diningOptionDetail",
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

export const diningOption = defineType({
  name: "diningOption",
  title: "Dining Option",
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
      name: "photoSecondary",
      title: "Second photo (optional)",
      type: "image",
      options: { hotspot: true },
      description:
        "When set, a second photo is shown side-by-side with the first (e.g. Bar & Salon)",
    }),
    defineField({
      name: "photoSecondaryAlt",
      title: "Second photo alt text",
      type: "string",
    }),
    defineField({
      name: "description",
      type: "array",
      of: [{ type: "text" }],
      description:
        "One entry per paragraph. Shown in full on the Dining Options page.",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "descriptionShort",
      title: "Short description",
      type: "array",
      of: [{ type: "text" }],
      description:
        "Subset of paragraphs shown on the Reservations page and Chef's Counter Menu page. Leave blank to use the full description.",
    }),
    defineField({
      name: "details",
      type: "array",
      of: [{ type: "diningOptionDetail" }],
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
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      description: 'Display price, e.g. "$190"',
    }),
    defineField({
      name: "priceSuffix",
      title: "Price suffix",
      type: "string",
      description: 'Shown after the price, e.g. "per person, plus tax and tip"',
    }),
    defineField({
      name: "bookingNote",
      title: "Booking note",
      type: "string",
      description:
        'Short note about payment or booking policy, e.g. "Bookings are paid in advance via OpenTable"',
    }),
    defineField({
      name: "pairings",
      title: "Optional pairings",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "label",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "price",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: "label", subtitle: "price" } },
        },
      ],
    }),
    defineField({
      name: "finePrint",
      title: "Fine print",
      type: "string",
      description:
        'Small note shown on the Menus page card (e.g. "Advanced reservations required.")',
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

export const diningOptionTypes = [diningOption, diningOptionDetail];
