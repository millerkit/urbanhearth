import { aboutPage } from "./aboutPage";
import { blogPost } from "./blogPost";
import { mailingListPage } from "./mailingListPage";
import { chefsCounter } from "./chefsCounter";
import { chefProfileTypes } from "./chefProfile";
import { diningAreaTypes } from "./diningArea";
import { farm } from "./farm";
import { footerLinks } from "./footerLinks";
import { galleryPhoto } from "./galleryPhoto";
import { homepageContent } from "./homepageContent";
import { menuTypes } from "./menu";
import { menusPage } from "./menusPage";
import { navLinkTypes } from "./navLinks";
import { product } from "./product";
import { privateEventTypes } from "./privateEventPackage";
import { reservationExperience } from "./reservationExperience";
import { siteSettings } from "./siteSettings";
import { teamMember } from "./teamMember";

export const schemaTypes = [
  siteSettings,
  homepageContent,
  teamMember,
  ...chefProfileTypes,
  ...diningAreaTypes,
  farm,
  galleryPhoto,
  reservationExperience,
  blogPost,
  ...menuTypes,
  product,
  ...privateEventTypes,
  ...navLinkTypes,
  footerLinks,
  chefsCounter,
  aboutPage,
  menusPage,
  mailingListPage,
];
