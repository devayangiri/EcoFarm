import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "agri_aqua_session";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "agri-aqua-network-phase-1-dev-secret-key-change-in-prod";
  return new TextEncoder().encode(secret);
}

function getRoleDashboardPath(role: string): string {
  switch (role) {
    case "FARMER":
      return "/farmer";
    case "BUYER":
      return "/buyer";
    case "AGENT":
      return "/agent";
    case "SERVICE_PROVIDER":
      return "/provider";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js internals, and public files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Generate or preserve safe X-Request-Id
  const incomingRequestId = request.headers.get("x-request-id");
  const requestId =
    incomingRequestId && /^[a-zA-Z0-9_-]{8,64}$/.test(incomingRequestId)
      ? incomingRequestId
      : crypto.randomUUID();

  // Create request headers with attached request ID for downstream propagation
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Helper to construct response with propagated X-Request-Id
  const withResponseHeaders = (res: NextResponse) => {
    res.headers.set("x-request-id", requestId);
    return res;
  };

  // 3. Safe CSRF Check on Browser Mutations
  const method = request.method.toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isWebhook = pathname.startsWith("/api/payments/webhook");
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (isMutation && hasSessionCookie && !isWebhook) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return withResponseHeaders(
            NextResponse.json(
              {
                success: false,
                error: {
                  code: "CSRF_ORIGIN_MISMATCH",
                  message: "Cross-site request forgery protection blocked this request",
                },
              },
              { status: 403 }
            )
          );
        }
      } catch {
        return withResponseHeaders(
          NextResponse.json(
            {
              success: false,
              error: {
                code: "INVALID_ORIGIN",
                message: "Malformed request origin",
              },
            },
            { status: 400 }
          )
        );
      }
    }
  }

  // 4. Extract & verify session token
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let sessionPayload: any = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, getJwtSecret(), {
        algorithms: ["HS256"],
      });
      sessionPayload = payload;
    } catch {
      sessionPayload = null;
    }
  }

  const isAuthenticated = !!sessionPayload && sessionPayload.status !== "SUSPENDED";

  // 5. Handle auth pages (/login, /register) when already logged in
  if (pathname === "/login" || pathname === "/register" || pathname === "/role-select") {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    // Only redirect authenticated users away from /login if there is NO callbackUrl.
    // If callbackUrl is present, the user was redirected to re-authenticate (e.g. session invalidated),
    // and we must clear any stale cookie and let them see the login screen to avoid ERR_TOO_MANY_REDIRECTS.
    if (isAuthenticated && !callbackUrl) {
      const targetDashboard = getRoleDashboardPath(sessionPayload.role);
      return withResponseHeaders(NextResponse.redirect(new URL(targetDashboard, request.url)));
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (callbackUrl && request.cookies.has(SESSION_COOKIE_NAME)) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return withResponseHeaders(response);
  }

  // 6. Protected Route Rules
  const isProtectedPath =
    pathname.startsWith("/farmer") ||
    pathname.startsWith("/buyer") ||
    pathname.startsWith("/agent") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders");

  if (isProtectedPath) {
    if (!isAuthenticated) {
      // Return 401 JSON for API calls, otherwise redirect to login with callbackUrl
      if (pathname.startsWith("/api/")) {
        return withResponseHeaders(
          NextResponse.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
              },
            },
            { status: 401 }
          )
        );
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      const res = NextResponse.redirect(loginUrl);
      if (request.cookies.has(SESSION_COOKIE_NAME)) {
        res.cookies.delete(SESSION_COOKIE_NAME);
      }
      return withResponseHeaders(res);
    }

    // Role-specific dashboard route enforcement
    const userRole = sessionPayload.role;

    if (pathname.startsWith("/farmer") && userRole !== "FARMER" && userRole !== "ADMIN") {
      return withResponseHeaders(NextResponse.redirect(new URL(getRoleDashboardPath(userRole), request.url)));
    }

    if (pathname.startsWith("/buyer") && userRole !== "BUYER" && userRole !== "ADMIN") {
      return withResponseHeaders(NextResponse.redirect(new URL(getRoleDashboardPath(userRole), request.url)));
    }

    if (pathname.startsWith("/agent") && userRole !== "AGENT" && userRole !== "ADMIN") {
      return withResponseHeaders(NextResponse.redirect(new URL(getRoleDashboardPath(userRole), request.url)));
    }

    if (pathname.startsWith("/provider") && userRole !== "SERVICE_PROVIDER" && userRole !== "ADMIN") {
      return withResponseHeaders(NextResponse.redirect(new URL(getRoleDashboardPath(userRole), request.url)));
    }

    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return withResponseHeaders(NextResponse.redirect(new URL(getRoleDashboardPath(userRole), request.url)));
    }
  }

  return withResponseHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
