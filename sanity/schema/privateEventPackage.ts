import { defineType, defineField } from "sanity";

const packageDetail = defineType({
  name: "packageDetail",
  title: "Package Detail",
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
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "value" },
  },
});

const capacityStat = defineType({
  name: "capacityStat",
  title: "Capacity Stat",
  type: "object",
  fields: [
    defineField({
      name: "value",
      type: "string",
      description: 'The number to display large, e.g. "50"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "label",
      type: "string",
      description: 'The label below the number, e.g. "Indoor seated"',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "value", subtitle: "label" },
  },
});

export const privateEventsPage = defineType({
  name: "privateEventsPage",
  title: "Private Events Page",
  type: "document",
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "capacityStats",
      title: "Capacity stats",
      type: "array",
      of: [{ type: "capacityStat" }],
      description:
        "Numbers shown in the capacity bar at the bottom of the page",
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
});

export const privateEventPackage = defineType({
  name: "private_event_package",
  title: "Private Event Package",
  type: "document",
  fields: [
    defineField({
      name: "order",
      title: "Display order",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "eyebrow",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "details",
      type: "array",
      of: [{ type: "packageDetail" }],
    }),
    defineField({
      name: "note",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "dark",
      title: "Dark background",
      type: "boolean",
      initialValue: false,
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

export const privateEventTypes = [
  privateEventsPage,
  privateEventPackage,
  packageDetail,
  capacityStat,
];
