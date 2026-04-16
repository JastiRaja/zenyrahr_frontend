import { ReactNode } from "react";

interface CommonDialogProps {
  isOpen: boolean;
  title: string;
  message?: ReactNode;
  tone?: "default" | "success" | "error";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
  isLoading?: boolean;
  hideCancel?: boolean;
}

export default function CommonDialog({
  isOpen,
  title,
  message,
  tone = "default",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onClose,
  isLoading = false,
  hideCancel = false,
}: CommonDialogProps) {
  if (!isOpen) return null;

  const titleClass =
    tone === "success"
      ? "text-emerald-700"
      : tone === "error"
      ? "text-rose-700"
      : "text-slate-900";
  const confirmClass =
    tone === "error"
      ? "bg-rose-600 hover:bg-rose-700"
      : tone === "success"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : "bg-sky-700 hover:bg-sky-800";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className={`text-lg font-semibold ${titleClass}`}>{title}</h3>
        </div>
        {message && (
          <div className="px-5 py-4">
            <div className="text-sm text-slate-700">{message}</div>
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          {!hideCancel && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm || onClose}
            disabled={isLoading}
            className={`rounded-md px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
