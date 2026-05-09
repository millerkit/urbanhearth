import { blogPost } from "./blogPost";
import { menuTypes } from "./menu";
import { product } from "./product";

export const schemaTypes = [blogPost, ...menuTypes, product];
