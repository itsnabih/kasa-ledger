import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  danger = true
}) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-lg bg-subtle border border-border">
          <AlertTriangle
            className={`w-5 h-5 shrink-0 mt-0.5 ${danger ? 'text-expense' : 'text-deposit'}`}
            strokeWidth={1.75}
          />
          <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" onClick={onClose} fullWidth>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            fullWidth
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
};
