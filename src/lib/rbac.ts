import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import type { UserRole, UserSession, Permission } from "@/types/role.types";

/**
 * Explicit Role-to-Permissions Mapping Matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  FARMER: [
    "AUTH_READ_SELF",
    "AUTH_UPDATE_SELF",
    "FARM_MANAGE",
    "PRODUCT_CREATE",
    "PRODUCT_UPDATE",
    "PRODUCT_DELETE",
    "PRODUCT_READ_OWN",
    "ORDER_READ_OWN",
    "ORDER_MANAGE_OWN",
    "NETWORK_CONNECT",
    "NETWORK_MANAGE_OWN",
  ] as const,

  BUYER: [
    "AUTH_READ_SELF",
    "AUTH_UPDATE_SELF",
    "ORDER_READ_OWN",
    "NETWORK_CONNECT",
    "NETWORK_MANAGE_OWN",
  ] as const,

  AGENT: [
    "AUTH_READ_SELF",
    "AUTH_UPDATE_SELF",
    "AGENT_MANAGE_ASSIGNED_USERS",
    "AGENT_MANAGE_LEADS",
    "AGENT_MANAGE_TASKS",
    "AGENT_REVIEW_VERIFICATION",
    "NETWORK_CONNECT",
    "NETWORK_MANAGE_OWN",
  ] as const,

  SERVICE_PROVIDER: [
    "AUTH_READ_SELF",
    "AUTH_UPDATE_SELF",
    "SERVICE_MANAGE_OWN",
    "SERVICE_QUOTE",
    "NETWORK_CONNECT",
    "NETWORK_MANAGE_OWN",
  ] as const,

  ADMIN: [
    "AUTH_READ_SELF",
    "AUTH_UPDATE_SELF",
    "FARM_MANAGE",
    "PRODUCT_CREATE",
    "PRODUCT_UPDATE",
    "PRODUCT_DELETE",
    "PRODUCT_READ_OWN",
    "ORDER_READ_OWN",
    "ORDER_MANAGE_OWN",
    "NETWORK_CONNECT",
    "NETWORK_MANAGE_OWN",
    "SERVICE_MANAGE_OWN",
    "SERVICE_QUOTE",
    "AGENT_MANAGE_ASSIGNED_USERS",
    "AGENT_MANAGE_LEADS",
    "AGENT_MANAGE_TASKS",
    "AGENT_REVIEW_VERIFICATION",
    "ADMIN_VIEW_DASHBOARD",
    "ADMIN_VIEW_USERS",
    "ADMIN_EDIT_USERS",
    "ADMIN_MANAGE_ROLES",
    "ADMIN_SUSPEND_USERS",
    "ADMIN_VIEW_PRODUCTS",
    "ADMIN_MODERATE_PRODUCTS",
    "ADMIN_VIEW_SERVICES",
    "ADMIN_MODERATE_SERVICES",
    "ADMIN_VIEW_VERIFICATIONS",
    "ADMIN_REVIEW_VERIFICATIONS",
    "ADMIN_VIEW_ORDERS",
    "ADMIN_MANAGE_ORDER_ISSUES",
    "ADMIN_VIEW_DISPUTES",
    "ADMIN_MANAGE_DISPUTES",
    "ADMIN_VIEW_REVIEWS",
    "ADMIN_MODERATE_REVIEWS",
    "ADMIN_VIEW_REPORTS",
    "ADMIN_RESOLVE_REPORTS",
    "ADMIN_VIEW_ANALYTICS",
    "ADMIN_VIEW_NOTIFICATIONS",
    "ADMIN_MANAGE_NOTIFICATIONS",
    "ADMIN_VIEW_AUDIT_LOGS",
    "ADMIN_MANAGE_SETTINGS",
    "ADMIN_MANAGE_USERS",
    "ADMIN_MANAGE_PRODUCTS",
    "ADMIN_MANAGE_VERIFICATION",
    "ADMIN_MANAGE_ORDERS",
  ] as const,
};

/**
 * Checks if a specific role possesses a permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? (permissions as readonly string[]).includes(permission) : false;
}

/**
 * Checks if a role matches one of the allowed roles
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole | UserRole[]): boolean {
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }
  return userRole === allowedRoles;
}

/**
 * Returns the standard home dashboard route for a given user role
 */
export function getRoleDashboardPath(role: UserRole): string {
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

/**
 * Server-side helper to retrieve the authenticated user session from request cookies
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifySessionToken(token);
    if (!session) return null;

    // Check account status directly against database
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          tokenVersion: true,
        },
      });

      if (
        !user ||
        user.status === "SUSPENDED" ||
        (session.tokenVersion > 0 && user.tokenVersion !== session.tokenVersion)
      ) {
        return null;
      }

      return {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role as UserRole,
        status: user.status as UserSession["status"],
        tokenVersion: user.tokenVersion,
      };
    } catch {
      // If database is offline in local preview, fall back to cryptographically verified JWT
      return {
        userId: session.userId,
        email: session.email,
        fullName: (session as any).fullName || session.email.split("@")[0],
        phone: (session as any).phone || null,
        role: session.role as UserRole,
        status: ((session as any).status as UserSession["status"]) || "ACTIVE",
        tokenVersion: (session as any).tokenVersion || 1,
      };
    }
  } catch {
    return null;
  }
}

/**
 * Guard that enforces user is logged in and not suspended
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getCurrentUser();
  if (!session) {
    throw AppError.unauthorized("Authentication required to access this resource");
  }
  return session;
}

/**
 * Guard that enforces user has one of the specified roles
 */
export async function requireRole(allowedRoles: UserRole | UserRole[]): Promise<UserSession> {
  const session = await requireAuth();
  if (!hasRole(session.role, allowedRoles)) {
    throw AppError.forbidden("You do not have permission to access this resource");
  }
  return session;
}

/**
 * Guard that enforces user has a specific permission
 */
export async function requirePermission(permission: Permission): Promise<UserSession> {
  const session = await requireAuth();
  if (!hasPermission(session.role, permission)) {
    throw AppError.forbidden("Access denied: missing required permission");
  }
  return session;
}

/**
 * Guard that enforces user is an ADMIN and has a specific administrative permission
 */
export async function requireAdminPermission(permission: Permission): Promise<UserSession> {
  const session = await requireAuth();
  if (session.role !== "ADMIN") {
    throw AppError.forbidden("Administrative access required");
  }
  if (!hasPermission(session.role, permission)) {
    throw AppError.forbidden(`Access denied: missing ${permission} permission`);
  }
  return session;
}
