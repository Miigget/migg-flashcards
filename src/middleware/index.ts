// Load environment variables from .env.production in AWS Lambda runtime
// AWS Amplify creates this file during build and moves it to compute directory
if (typeof window === "undefined" && !import.meta.env?.DEV) {
  // Use dynamic import for server environments (not dev mode)
  import("@/lib/env-loader").catch((error) => {
    // eslint-disable-next-line no-console
    console.warn("Failed to load env-loader:", error);
  });
}

import { defineMiddleware } from "astro:middleware";
// import { type MiddlewareHandler } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

// Define public paths that don't require authentication
const PUBLIC_PATHS = [
  "/", // Allow access to index, which redirects
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  // Auth API endpoints are implicitly public as they handle auth logic
  // We don't strictly need to list /api/auth/* here unless there are GET endpoints
  // But checking specifically for /api/auth might be safer if GET endpoints are added later
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout", // Logout might be called when logged in, but should be accessible
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  // Add other public assets or pages if needed (e.g., favicon, public images)
];

// Helper to check if a path matches any pattern in PUBLIC_PATHS
// Allows for simple wildcard checks like /api/auth/* if needed in the future
const isPublicPath = (pathname: string): boolean => {
  // Basic check for exact match or prefix
  return PUBLIC_PATHS.some(
    (publicPath) =>
      pathname === publicPath ||
      pathname.startsWith(publicPath + "/") ||
      (publicPath.endsWith("/*") && pathname.startsWith(publicPath.slice(0, -1)))
  );
  // More specific check if needed:
  // return PUBLIC_PATHS.includes(pathname);
};

// Define the single middleware function
export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create Supabase client instance for this request
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Expose Supabase client instance to locals
  locals.supabase = supabase;

  // IMPORTANT: Use getUser() for server-side validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store user data in locals
  locals.user = null; // Initialize as null
  if (user) {
    locals.user = {
      id: user.id,
      email: user.email ?? "No email", // Handle potential null email
    };
  }

  // Check if the current path is public
  const pathIsPublic = isPublicPath(url.pathname);

  // If trying to access a protected route without a user, redirect to login
  if (!locals.user && !pathIsPublic) {
    // eslint-disable-next-line no-console
    console.log(`Redirecting unauthenticated access to ${url.pathname} -> /auth/login`);
    return redirect("/auth/login");
  }

  // If trying to access auth pages while already logged in, redirect to /dashboard
  if (locals.user && (url.pathname === "/auth/login" || url.pathname === "/auth/register")) {
    // eslint-disable-next-line no-console
    console.log(`Redirecting logged in user from ${url.pathname} -> /dashboard`);
    return redirect("/dashboard");
  }

  // Continue to the next middleware or page
  return next();
});
