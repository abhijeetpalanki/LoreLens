import { NextFetchEvent, NextRequest } from "next/server";

export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  const { clerkMiddleware, createRouteMatcher } =
    await import("@clerk/nextjs/server");

  const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/franchise(.*)",
    "/api/chat(.*)",
  ]);

  const clerk = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  });

  return clerk(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
