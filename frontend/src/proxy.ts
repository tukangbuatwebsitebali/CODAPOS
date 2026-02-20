import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
    const hostname = request.headers.get("host") || "";
    const { pathname } = request.nextUrl;

    // ── app.codapos.com → App routes (dashboard, login, signup, store) ──
    // These are already handled by the existing routing, no rewrite needed.
    // The subdomain "app" serves the full Next.js app as-is.

    // ── codapos.com (no subdomain) → Marketing/landing page ──
    // On the main domain, only "/" shows the landing page.
    // All other routes (/login, /dashboard, etc.) work normally.

    // For local development, everything works as-is:
    // localhost:3000 → landing page (page.tsx)
    // localhost:3000/dashboard → dashboard
    // localhost:3000/login → login

    // If we're on the main domain (codapos.com without "app" prefix)
    // and trying to access app-only routes, redirect to app subdomain
    const isAppSubdomain = hostname.startsWith("app.");
    const isMainDomain = !isAppSubdomain && (
        hostname.includes("codapos.com") ||
        hostname.startsWith("localhost") ||
        hostname.startsWith("127.0.0.1")
    );

    // On main domain, app routes work directly (no redirect needed for dev)
    // In production, you might want to redirect /dashboard to app.codapos.com/dashboard
    if (isMainDomain && hostname.includes("codapos.com")) {
        const appRoutes = ["/dashboard", "/login", "/signup"];
        if (appRoutes.some((route) => pathname.startsWith(route))) {
            const url = request.nextUrl.clone();
            url.hostname = `app.${hostname}`;
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        // Match all routes except static files and API
        "/((?!_next/static|_next/image|favicon.ico|uploads|api).*)",
    ],
};
