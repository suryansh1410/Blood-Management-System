import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "critical";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-md",
    md: "px-2.5 py-1 text-xs font-semibold rounded-full",
  };

  const variantClasses: Record<BadgeVariant, string> = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-rose-50 text-rose-700 border border-rose-200",
    critical: "bg-rose-100 text-rose-800 border border-rose-300 font-bold",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export function StatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
    case "VERIFIED":
    case "FULFILLED":
      return <Badge variant="success">{status.replace("_", " ")}</Badge>;

    case "PENDING":
    case "LOW_STOCK":
      return <Badge variant="warning">{status.replace("_", " ")}</Badge>;

    case "APPROVED":
      return <Badge variant="info">APPROVED</Badge>;

    case "CRITICAL":
      return <Badge variant="critical">CRITICAL</Badge>;

    case "OUT_OF_STOCK":
    case "REJECTED":
      return <Badge variant="danger">{status.replace("_", " ")}</Badge>;

    case "CANCELLED":
    case "UNAVAILABLE":
    default:
      return <Badge variant="neutral">{status?.replace("_", " ") || "UNKNOWN"}</Badge>;
  }
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  switch (urgency?.toUpperCase()) {
    case "EMERGENCY":
      return <Badge variant="danger">EMERGENCY</Badge>;
    case "URGENT":
      return <Badge variant="warning">URGENT</Badge>;
    case "NORMAL":
    default:
      return <Badge variant="neutral">NORMAL</Badge>;
  }
}
