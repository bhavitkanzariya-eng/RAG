import { clerkMiddleware } from '@clerk/nextjs/server';

// This middleware sets up Clerk auth context for all requests
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip internal routes
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
