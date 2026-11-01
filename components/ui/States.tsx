import React from "react";
import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "./Button";

export const LoadingSpinner: React.FC<{
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ text = "Loading data...", size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-slate-400 gap-3 ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-teal-400`} />
      {text && <p className="text-sm font-medium text-slate-300 animate-pulse">{text}</p>}
    </div>
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}> = ({ icon, title, description, action, className = "" }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-slate-900/80 rounded-2xl border border-dashed border-slate-800 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mb-4 border border-slate-700/60">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-base font-bold text-slate-100 mb-1">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="primary" size="sm">
          {action.icon}
          {action.label}
        </Button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Something went wrong",
  message = "We couldn't complete this action. Please try again.",
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 bg-rose-950/20 rounded-2xl border border-rose-900/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-bold text-rose-200 mb-1">{title}</h4>
      <p className="text-sm text-rose-300/80 max-w-sm mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      )}
    </div>
  );
};
