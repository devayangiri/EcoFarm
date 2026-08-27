"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { Search, ShieldAlert, UserCheck, UserX, Shield, Check } from "lucide-react";
import { UserRole, UserStatus } from "@prisma/client";

export interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface UserManagementViewProps {
  initialUsers: UserItem[];
  currentAdminId: string;
}

export function UserManagementView({ initialUsers, currentAdminId }: UserManagementViewProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [modalAction, setModalAction] = useState<"STATUS" | "ROLE" | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>("ACTIVE");
  const [newRole, setNewRole] = useState<UserRole>("BUYER");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term));
    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    const matchesStatus = selectedStatus === "ALL" || u.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenStatusModal = (user: UserItem) => {
    setSelectedUser(user);
    setNewStatus(user.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED");
    setReason("");
    setModalAction("STATUS");
    setErrorMessage(null);
  };

  const handleOpenRoleModal = (user: UserItem) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setReason("");
    setModalAction("ROLE");
    setErrorMessage(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (modalAction === "STATUS") {
        const res = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, reason }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to update user status");

        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, status: newStatus } : u))
        );
        setSuccessMessage(`User ${selectedUser.fullName} status updated to ${newStatus}.`);
      } else if (modalAction === "ROLE") {
        const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole, reason }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || "Failed to update user role");

        setUsers((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, role: newRole } : u))
        );
        setSuccessMessage(`User ${selectedUser.fullName} role updated to ${newRole}.`);
      }

      setModalAction(null);
      setSelectedUser(null);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-body text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div className="space-y-1">
          <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
            User Administration
          </h1>
          <p className="text-xs text-slate-neutral">
            Inspect accounts, manage roles, audit status, and enforce account suspension.
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-9 bg-surface-low"
          />
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-neutral" />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="h-9 px-3 rounded-lg border border-surface-dim bg-surface-low text-xs text-on-surface focus:outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="FARMER">Farmer</option>
          <option value="BUYER">Buyer</option>
          <option value="AGENT">Agent</option>
          <option value="SERVICE_PROVIDER">Service Provider</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-9 px-3 rounded-lg border border-surface-dim bg-surface-low text-xs text-on-surface focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING_VERIFICATION">Pending Verification</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <Card className="p-0 bg-white border border-surface-dim shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-low border-b border-surface-dim font-heading font-semibold text-slate-neutral">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Role</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verification</th>
                <th className="p-3">Registered</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-low/50 transition-colors">
                  <td className="p-3">
                    <strong className="font-heading font-bold text-on-surface block">
                      {u.fullName}
                    </strong>
                    <span className="text-[11px] text-slate-neutral">{u.email}</span>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" size="sm">{u.role}</Badge>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant={u.status === "ACTIVE" ? "primary" : u.status === "SUSPENDED" ? "error" : "warning"}
                      size="sm"
                    >
                      {u.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {u.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-status-success font-medium">
                        <Check className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-neutral">Unverified</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-neutral">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRoleModal(u)}
                      className="text-[11px] h-7 px-2"
                    >
                      Role
                    </Button>
                    <Button
                      variant={u.status === "SUSPENDED" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => handleOpenStatusModal(u)}
                      className="text-[11px] h-7 px-2 text-status-error hover:bg-status-error/10"
                    >
                      {u.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Confirmation Dialog */}
      {modalAction && selectedUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              {modalAction === "STATUS"
                ? `Confirm Account Status Change: ${selectedUser.fullName}`
                : `Modify User Role: ${selectedUser.fullName}`}
            </h3>

            {modalAction === "STATUS" ? (
              <div className="space-y-2 text-xs">
                <p className="text-slate-neutral">
                  Select new account status. Suspending an account revokes all active session tokens immediately.
                </p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                  className="w-full h-9 px-3 rounded-lg border border-surface-dim bg-surface-low text-xs"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <p className="text-slate-neutral">
                  Select new user role. Changing role invalidates current session tokens.
                </p>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full h-9 px-3 rounded-lg border border-surface-dim bg-surface-low text-xs"
                >
                  <option value="FARMER">FARMER</option>
                  <option value="BUYER">BUYER</option>
                  <option value="AGENT">AGENT</option>
                  <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-on-surface">Reason for Change *</label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State administrative rationale for this audit record..."
                className="w-full rounded-lg border border-surface-dim bg-surface-low p-2 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalAction(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmAction}
                disabled={isSubmitting || !reason.trim()}
                isLoading={isSubmitting}
              >
                Confirm & Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
