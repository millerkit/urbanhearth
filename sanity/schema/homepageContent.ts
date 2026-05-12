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
