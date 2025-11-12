import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/navigation",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    if (
      req.method === "POST" &&
      (req.headers.get("next-action") ?? req.headers.get("Next-Action"))
    ) {
      return;
    }
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
