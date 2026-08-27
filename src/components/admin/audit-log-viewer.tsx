"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { Search, FileText } from "lucide-react";

export interface AuditItem {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  actorUserId?: string | null;
  actorName: string;
  actorRole: string;
  metadata?: any;
  ipAddress?: string | null;
  createdAt: string;
}

export function AuditLogViewer({ initialLogs }: { initialLogs: AuditItem[] }) {
  const [logs, setLogs] = useState<AuditItem[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditItem | null>(null);

  const filtered = logs.filter((l) => {
    const term = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      l.resource.toLowerCase().includes(term) ||
      l.actorName.toLowerCase().includes(term) ||
      (l.resourceId && l.resourceId.includes(term))
    );
  });

  return (
    <div className="space-y-6 font-body text-left">
      <div className="border-b border-surface-dim pb-4 space-y-1">
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-on-surface">
          Immutable Audit Log Explorer
        </h1>
        <p className="text-xs text-slate-neutral">
          Read-only forensic audit trail recording all administrative mutations, logins, and operational overrides.
        </p>
      </div>

      <div className="relative">
        <Input
          placeholder="Filter by action, resource, or actor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 text-xs h-9 bg-surface-low"
        />
        <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-neutral" />
      </div>

      <Card className="p-0 bg-white border border-surface-dim shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-surface-low border-b border-surface-dim font-heading font-semibold text-slate-neutral">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Resource</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dim">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-surface-low/50">
                  <td className="p-3 text-slate-neutral">{formatDate(l.createdAt)}</td>
                  <td className="p-3 font-semibold text-on-surface">
                    {l.actorName} ({l.actorRole})
                  </td>
                  <td className="p-3"><Badge variant="secondary" size="sm">{l.action}</Badge></td>
                  <td className="p-3 text-slate-neutral">{l.resource} #{l.resourceId?.slice(0, 8) || ""}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setSelectedLog(l)}
                      className="text-xs text-brand-primary font-semibold hover:underline"
                    >
                      Inspect JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-surface-dim text-left">
            <h3 className="font-heading font-bold text-base text-on-surface">
              Audit Event: {selectedLog.action}
            </h3>
            <div className="text-xs space-y-1 text-slate-neutral">
              <div>Actor: <strong>{selectedLog.actorName}</strong> ({selectedLog.actorRole})</div>
              <div>Resource: {selectedLog.resource} #{selectedLog.resourceId || "N/A"}</div>
              <div>Timestamp: {formatDate(selectedLog.createdAt)}</div>
            </div>

            <pre className="bg-surface-low p-3 rounded-lg text-[11px] overflow-x-auto border border-surface-dim max-h-60">
              {JSON.stringify(selectedLog.metadata, null, 2)}
            </pre>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg border border-surface-dim text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
