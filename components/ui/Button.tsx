import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer focus:ring-offset-slate-950";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const variantClasses = {
    primary:
      "bg-teal-600 hover:bg-teal-500 text-white shadow-sm hover:shadow focus:ring-teal-400 active:bg-teal-700",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-200 focus:ring-slate-500 active:bg-slate-600 border border-slate-700",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white shadow-sm hover:shadow focus:ring-rose-400 active:bg-rose-700",
    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow focus:ring-emerald-400 active:bg-emerald-700",
    outline:
      "border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 focus:ring-teal-500 active:bg-slate-700",
    ghost:
      "bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white focus:ring-slate-500",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
};
