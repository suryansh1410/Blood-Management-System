import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type AlertVariant = "info" | "success" | "warning" | "danger" | "emergency";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({
  variant = "info",
  title,
  children,
  icon,
  onClose,
  className = "",
}: AlertProps) {
  const styles: Record<AlertVariant, { bg: string; border: string; text: string; iconCol: string }> = {
    info: {
      bg: "bg-sky-950/40",
      border: "border-sky-800/60",
      text: "text-sky-200",
      iconCol: "text-sky-400",
    },
    success: {
      bg: "bg-emerald-950/40",
      border: "border-emerald-800/60",
      text: "text-emerald-200",
      iconCol: "text-emerald-400",
    },
    warning: {
      bg: "bg-amber-950/40",
      border: "border-amber-800/60",
      text: "text-amber-200",
      iconCol: "text-amber-400",
    },
    danger: {
      bg: "bg-rose-950/40",
      border: "border-rose-800/60",
      text: "text-rose-200",
      iconCol: "text-rose-400",
    },
    emergency: {
      bg: "bg-rose-950/70",
      border: "border-rose-600/70",
      text: "text-rose-100",
      iconCol: "text-rose-400",
    },
  };

  const defaultIcons: Record<AlertVariant, React.ReactNode> = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle2 className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    danger: <AlertCircle className="w-5 h-5" />,
    emergency: <AlertCircle className="w-5 h-5" />,
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      <div className={`shrink-0 mt-0.5 ${current.iconCol}`}>{icon || defaultIcons[variant]}</div>
      <div className="flex-1 text-sm">
        {title && <h5 className="font-bold text-slate-100 mb-0.5 leading-snug">{title}</h5>}
        <div className="leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 transition-colors cursor-pointer"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
