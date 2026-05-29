import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  if (import.meta.env.HOLDING_PAGE === "true") {
    const { pathname } = new URL(context.request.url);
    if (
      !pathname.startsWith("/holding") &&
      !pathname.startsWith("/_astro/") &&
      pathname !== "/favicon.ico" &&
      pathname !== "/favicon.svg"
    ) {
      return context.redirect("/holding", 302);
    }
  }
  return next();
});
