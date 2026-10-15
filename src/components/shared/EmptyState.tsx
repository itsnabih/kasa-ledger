import React from 'react';
import { Button } from '../ui/Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="border border-dashed border-border rounded-xl p-8 text-center bg-surface/50 flex flex-col items-center justify-center">
      {icon ? (
        <div className="w-11 h-11 rounded-lg bg-subtle border border-border flex items-center justify-center text-text-secondary mb-3">
          {icon}
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary max-w-sm mt-1 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
};
