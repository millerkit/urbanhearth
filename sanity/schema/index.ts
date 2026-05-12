import { blogPost } from "./blogPost";
import { chefProfileTypes } from "./chefProfile";
import { farm } from "./farm";
import { homepageContent } from "./homepageContent";
import { menuTypes } from "./menu";
import { product } from "./product";
import { privateEventTypes } from "./privateEventPackage";
import { siteSettings } from "./siteSettings";
import { teamMember } from "./teamMember";

export const schemaTypes = [
  siteSettings,
  homepageContent,
  teamMember,
  ...chefProfileTypes,
  farm,
  blogPost,
  ...menuTypes,
  product,
  ...privateEventTypes,
];
