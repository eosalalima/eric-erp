import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    if (req.method === "POST" && req.headers.has("Next-Action")) return;
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next|sign-in|sign-up|$).*)"],
};
