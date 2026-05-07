import { defineType, defineField } from 'sanity'

const menuItem = defineType({
  name: 'menuItem',
  title: 'Menu Item',
  type: 'object',
  fields: [
    defineField({ name: 'name', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'price', type: 'string' }),
    defineField({ name: 'description', type: 'string' }),
    defineField({ name: 'note', type: 'string' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'price' },
  },
})

const menuSection = defineType({
  name: 'menuSection',
  title: 'Menu Section',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: Rule => Rule.required() }),
    defineField({
      name: 'items',
      type: 'array',
      of: [{ type: 'menuItem' }],
    }),
  ],
  preview: {
    select: { title: 'title' },
  },
})

export const menu = defineType({
  name: 'menu',
  title: 'Menu',
  type: 'document',
  fields: [
    defineField({ name: 'season', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'footer_note', title: 'Footer note', type: 'string' }),
    defineField({
      name: 'sections',
      type: 'array',
      of: [{ type: 'menuSection' }],
    }),
  ],
  preview: {
    select: { title: 'season' },
  },
})

export const menuTypes = [menu, menuSection, menuItem]
