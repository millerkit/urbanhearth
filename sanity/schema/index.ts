import { blogPost } from "./blogPost";
import { menuTypes } from "./menu";
import { product } from "./product";
import { privateEventTypes } from "./privateEventPackage";
import { siteSettings } from "./siteSettings";

export const schemaTypes = [
  siteSettings,
  blogPost,
  ...menuTypes,
  product,
  ...privateEventTypes,
];
