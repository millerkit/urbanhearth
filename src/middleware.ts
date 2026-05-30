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
      return new Response(
        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/holding"><script>location.replace('/holding')</script></head><body></body></html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }
  }
  return next();
});
