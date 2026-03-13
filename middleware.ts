import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect the dashboard and interview routes
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/interview(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect(); // Redirects to login if not authenticated
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
