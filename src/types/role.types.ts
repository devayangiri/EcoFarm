export type UserRole = "FARMER" | "BUYER" | "AGENT" | "SERVICE_PROVIDER" | "ADMIN";

export type UserStatus = "ACTIVE" | "PENDING_VERIFICATION" | "SUSPENDED";

export const PUBLIC_ROLES: UserRole[] = ["FARMER", "BUYER", "AGENT", "SERVICE_PROVIDER"];

export type Permission =
  | "AUTH_READ_SELF"
  | "AUTH_UPDATE_SELF"
  | "FARM_MANAGE"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "PRODUCT_READ_OWN"
  | "ORDER_READ_OWN"
  | "ORDER_MANAGE_OWN"
  | "NETWORK_CONNECT"
  | "NETWORK_MANAGE_OWN"
  | "SERVICE_MANAGE_OWN"
  | "SERVICE_QUOTE"
  | "AGENT_MANAGE_ASSIGNED_USERS"
  | "AGENT_MANAGE_LEADS"
  | "AGENT_MANAGE_TASKS"
  | "AGENT_REVIEW_VERIFICATION"
  | "ADMIN_MANAGE_USERS"
  | "ADMIN_MANAGE_PRODUCTS"
  | "ADMIN_MANAGE_VERIFICATION"
  | "ADMIN_MANAGE_ORDERS"
  | "ADMIN_VIEW_ANALYTICS"
  | "ADMIN_MANAGE_SETTINGS";

export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  tokenVersion: number;
}
