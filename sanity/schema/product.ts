import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      description:
        'Used to filter products on the storefront (e.g. "Coffee", "Pantry", "Merch")',
      options: {
        list: [
          { title: "From the Kitchen", value: "kitchen" },
          { title: "Bottled Cocktails", value: "cocktails" },
          { title: "Bar Mixers", value: "mixers" },
          { title: "Non-Alcoholic", value: "non-alcoholic" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "price",
      type: "number",
      description: "Synced from Toast. In dollars.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 2,
      description: "Synced from Toast. Shown in product listings.",
    }),
    defineField({
      name: "longDescription",
      title: "Long description",
      type: "array",
      description:
        "Editorial content managed in Sanity. Shown on the product detail page.",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "available",
      type: "boolean",
      description: "Synced from Toast. Reflects current in-stock status.",
      initialValue: true,
    }),
    defineField({
      name: "modifierGroups",
      type: "array",
      description:
        "Synced from Toast. Options the customer selects at checkout (e.g. grind, size).",
      of: [
        {
          type: "object",
          name: "modifierGroup",
          fields: [
            defineField({ name: "name", type: "string" }),
            defineField({ name: "toastGuid", type: "string" }),
            defineField({ name: "minSelections", type: "number" }),
            defineField({ name: "maxSelections", type: "number" }),
            defineField({
              name: "modifiers",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "modifier",
                  fields: [
                    defineField({ name: "name", type: "string" }),
                    defineField({ name: "price", type: "number" }),
                    defineField({ name: "toastGuid", type: "string" }),
                  ],
                  preview: { select: { title: "name", subtitle: "price" } },
                },
              ],
            }),
          ],
          preview: { select: { title: "name" } },
        },
      ],
    }),
    defineField({
      name: "toastItemGuid",
      title: "Toast item GUID",
      type: "string",
      description: "Set by the sync script. Do not edit manually.",
      readOnly: true,
    }),
    defineField({
      name: "toastGroupGuid",
      title: "Toast group GUID",
      type: "string",
      description: "Set by the sync script. Do not edit manually.",
      readOnly: true,
    }),
    defineField({
      name: "toastGroupName",
      title: "Toast group name",
      type: "string",
      description:
        "Synced from Toast. Used to group products on the storefront.",
      readOnly: true,
    }),
    defineField({
      name: "toastGroupDescription",
      title: "Toast group description",
      type: "text",
      rows: 2,
      description:
        "Synced from Toast. Shown as the section description on the shop page.",
      readOnly: true,
    }),
    defineField({
      name: "toastGroupIndex",
      title: "Toast group index",
      type: "number",
      description:
        "Synced from Toast. Controls the display order of groups on the shop page.",
      readOnly: true,
    }),
    defineField({
      name: "toastSortOrder",
      title: "Toast sort order",
      type: "number",
      description:
        "Synced from Toast. Controls the display order of items within a group.",
      readOnly: true,
    }),
  ],
  orderings: [
    {
      title: "Menu order",
      name: "menuOrder",
      by: [
        { field: "toastGroupIndex", direction: "asc" },
        { field: "toastSortOrder", direction: "asc" },
      ],
    },
    {
      title: "Name (A–Z)",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "toastGroupName", media: "image" },
  },
});
