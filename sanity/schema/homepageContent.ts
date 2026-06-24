import { defineField, defineType } from "sanity";

export const homepageContent = defineType({
  name: "homepageContent",
  title: "Homepage Content",
  type: "document",
  // Singleton — prevent editors from creating more than one
  __experimental_actions: ["update", "publish"],
  fields: [
    defineField({
      name: "statement",
      title: "Intro statement",
      type: "object",
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          description: 'e.g. "Inman Square, Cambridge"',
        }),
        defineField({
          name: "tags",
          type: "string",
          description: 'e.g. "Locally sourced · Globally inspired"',
        }),
        defineField({
          name: "definitionTerm",
          title: "Definition term",
          type: "string",
          description: 'Rendered in italics — e.g. "hearth."',
        }),
        defineField({
          name: "definitionText",
          title: "Definition text",
          type: "text",
          rows: 2,
          description: "The rest of the definition sentence",
        }),
        defineField({
          name: "description",
          type: "text",
          rows: 3,
          description: "Second paragraph beneath the definition",
        }),
      ],
    }),
    defineField({
      name: "teasersEyebrow",
      title: "Dining teasers eyebrow",
      type: "string",
      description:
        'Short line above the Reserve button beneath the dining-area cards — e.g. "Choose your dining experience"',
    }),
    defineField({
      name: "diningTeasers",
      title: "Dining teaser photos",
      type: "array",
      description:
        "Homepage teaser photo for each dining option, keyed by area ID (dining-room, chefs-counter, salon)",
      of: [
        {
          type: "object",
          name: "diningTeaser",
          fields: [
            defineField({
              name: "areaId",
              title: "Area ID",
              type: "string",
              validation: (Rule) => Rule.required(),
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
          ],
          preview: { select: { title: "areaId", media: "photo" } },
        },
      ],
    }),
    defineField({
      name: "intro",
      title: "Intro section",
      type: "object",
      fields: [
        defineField({
          name: "eyebrow",
          type: "string",
          description: 'e.g. "The Restaurant"',
        }),
        defineField({
          name: "paragraphs",
          type: "array",
          of: [{ type: "text" }],
          description: "One entry per paragraph",
        }),
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Homepage Content" };
    },
  },
});
