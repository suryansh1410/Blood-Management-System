"use client";

import React, { useEffect } from "react";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning" | "success";
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  isLoading = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden transform animate-in zoom-in-95 duration-200 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {variant === "danger" && (
              <div className="p-2 bg-rose-500/15 text-rose-400 border border-rose-500/25 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            {variant === "warning" && (
              <div className="p-2 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            {variant === "primary" && (
              <div className="p-2 bg-teal-500/15 text-teal-400 border border-teal-500/25 rounded-xl">
                <Info className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-100 leading-tight">{title}</h3>
              {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children && <div className="p-6 text-slate-200">{children}</div>}

        <div className="flex items-center justify-end gap-3 p-4 bg-slate-900/95 border-t border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
