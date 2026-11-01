"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { Bell, Check, CheckCheck, RefreshCw, AlertTriangle, Heart, FileText } from "lucide-react";

export default function AdminNotificationsPage() {
  const { success, error: toastError } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      const json = await res.json();
      setNotifications(json.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        success("Notification marked as read");
      }
    } catch {
      toastError("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      await fetch(`/api/notifications/${n.id}/read`, { method: "PATCH" });
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    success("All notifications marked as read");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            System Alerts & Events
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System-wide notifications, critical low stock alerts, and inbound requisitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifs} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={markAllAsRead} className="gap-1.5">
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading system notifications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifs} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No system notifications"
          description="System events and low stock alerts will be logged here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const isWarning = notif.type.includes("WARNING") || notif.type.includes("STOCK");
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                  notif.isRead
                    ? "bg-white border-slate-200 text-slate-700"
                    : isWarning
                    ? "bg-amber-50/70 border-amber-200 text-amber-950 font-medium shadow-xs"
                    : "bg-teal-50/60 border-teal-200 text-teal-950 font-medium shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isWarning ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : notif.type.includes("DONATION") ? (
                      <Heart className="w-5 h-5 text-rose-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-slate-600 uppercase tracking-wider text-[10px]">
                        {notif.type.replace(/_/g, " ")}
                      </span>
                      <span>•</span>
                      <span>{new Date(notif.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{notif.message}</p>
                  </div>
                </div>

                {!notif.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markAsRead(notif.id)}
                    className="shrink-0 text-xs gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark Read
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
