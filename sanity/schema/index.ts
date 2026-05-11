import { blogPost } from "./blogPost";
import { menuTypes } from "./menu";
import { product } from "./product";
import { privateEventTypes } from "./privateEventPackage";
import { siteSettings } from "./siteSettings";
import { teamMember } from "./teamMember";

export const schemaTypes = [
  siteSettings,
  teamMember,
  blogPost,
  ...menuTypes,
  product,
  ...privateEventTypes,
];
