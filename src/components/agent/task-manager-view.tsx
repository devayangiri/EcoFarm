"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Check, X, Calendar, AlertTriangle } from "lucide-react";

export interface TaskManagerViewProps {
  initialTasks: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate: string;
    priority: string;
    status: string;
    isOverdue: boolean;
    linkedLead?: { id: string; contactName: string } | null;
  }>;
}

export function TaskManagerView({ initialTasks }: TaskManagerViewProps) {
  const router = useRouter();
  const [filterView, setFilterView] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date().toISOString().slice(0, 10),
    priority: "MEDIUM",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/agent/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to create task");

      setIsCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        dueDate: new Date().toISOString().slice(0, 10),
        priority: "MEDIUM",
      });
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/agent/tasks/${taskId}/complete`, { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to complete task");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTasks = initialTasks.filter((t) => {
    if (filterView === "OVERDUE") return t.isOverdue;
    if (filterView === "COMPLETED") return t.status === "COMPLETED";
    if (filterView === "PENDING") return t.status !== "COMPLETED";
    return true;
  });

  return (
    <div className="space-y-6 font-body text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-dim pb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-on-surface">Agent Task Manager</h1>
          <p className="text-xs text-slate-neutral">
            Organize field visits, document collection, farmer meetings, and follow-ups.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {["ALL", "PENDING", "OVERDUE", "COMPLETED"].map((view) => (
          <Button
            key={view}
            variant={filterView === view ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilterView(view)}
            className="text-xs"
          >
            {view}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          title="No Tasks Found"
          description="There are no tasks matching the selected filter criteria."
        />
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((t) => (
            <Card
              key={t.id}
              className={`p-4 bg-white border ${
                t.isOverdue ? "border-status-error/40 bg-status-error/5" : "border-surface-dim"
              } shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <strong className="font-heading font-bold text-sm text-on-surface truncate">{t.title}</strong>
                  <Badge variant={t.priority === "URGENT" || t.priority === "HIGH" ? "error" : "secondary"} size="sm">
                    {t.priority}
                  </Badge>
                  {t.isOverdue && (
                    <Badge variant="error" size="sm" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                </div>

                {t.description && <p className="text-xs text-slate-neutral line-clamp-1">{t.description}</p>}

                <div className="flex items-center gap-3 text-[11px] text-slate-neutral">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(t.dueDate).toLocaleDateString()}
                  </span>
                  {t.linkedLead && <span>Lead: <strong className="text-on-surface">{t.linkedLead.contactName}</strong></span>}
                </div>
              </div>

              {t.status !== "COMPLETED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompleteTask(t.id)}
                  leftIcon={<Check className="h-3.5 w-3.5 text-status-success" />}
                >
                  Mark Complete
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Operational Task"
        description="Schedule a field visit, customer call, or verification inspection."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTask} className="space-y-4 font-body text-left">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          <FormField label="Task Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Conduct land survey at Farm #4 - Swadhin"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Due Date" required>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Priority" required>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { label: "Low Priority", value: "LOW" },
                  { label: "Medium Priority", value: "MEDIUM" },
                  { label: "High Priority", value: "HIGH" },
                  { label: "Urgent Priority", value: "URGENT" },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Task Description & Instructions">
            <Textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Specify location landmarks, required documents, or sample collection tools..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
              Save Task
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
