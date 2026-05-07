import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './sanity/schema'

const projectId = 'h5or5cm0'

export default defineConfig({
  name: 'urbanhearth',
  title: 'Urban Hearth',
  projectId,
  dataset: 'production',
  plugins: [structureTool()],
  schema: { types: schemaTypes },
  deployment: {
    appId: 'nlf71yb3cny2rg1jjjowghub',
  },
})
