import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تایید",
  cancelText = "انصراف",
  isDanger = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex flex-col items-center text-center p-2" dir="rtl">
        {/* Warning Icon */}
        <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-250 flex items-center justify-center text-rose-600 mb-4 animate-ping-once">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <DialogTitle className="text-lg font-black text-ink mb-2">
          {title}
        </DialogTitle>

        <p className="text-xs text-muted-text font-semibold leading-relaxed mb-6 max-w-sm">
          {description}
        </p>

        <div className="flex items-center gap-3 w-full">
          <Button
            onClick={onConfirm}
            variant={isDanger ? "accent" : "primary"}
            className="flex-1 h-11 text-xs font-bold bg-rose-600 hover:bg-rose-750 text-white"
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1 h-11 text-xs font-semibold border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
