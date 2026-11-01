"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner, EmptyState, ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { Bell, Check, CheckCheck, RefreshCw, Clock } from "lucide-react";

export default function DonorNotificationsPage() {
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verification updates, system notices, and emergency alerts.
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
        <LoadingSpinner text="Loading notifications..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifs} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No notifications yet"
          description="You will receive real-time notifications here when your donation records are verified."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                notif.isRead
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-teal-50/50 border-teal-200 text-teal-950 font-medium shadow-xs"
              }`}
            >
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
          ))}
        </div>
      )}
    </div>
  );
}
