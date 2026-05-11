import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schema";

const projectId = "h5or5cm0";
const singletonTypes = new Set(["siteSettings"]);

export default defineConfig({
  name: "urbanhearth",
  title: "Urban Hearth",
  projectId,
  dataset: "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
  document: {
    actions: (prev, context) => {
      if (singletonTypes.has(context.schemaType)) {
        return prev.filter(({ action }) =>
          action
            ? ["publish", "discardChanges", "restore"].includes(action)
            : true,
        );
      }

      return prev;
    },
  },
  deployment: {
    appId: "nlf71yb3cny2rg1jjjowghub",
  },
});
