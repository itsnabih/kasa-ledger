import React from 'react';

export type BadgeTone = 'neutral' | 'income' | 'expense' | 'brand' | 'deposit';

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  tone = 'neutral',
  children,
  className = ''
}) => {
  const toneClasses: Record<BadgeTone, string> = {
    neutral: 'bg-subtle text-text-secondary border-border',
    income: 'bg-income/10 text-income border-income/30',
    expense: 'bg-expense/10 text-expense border-expense/30',
    brand: 'bg-brand/10 text-brand border-brand/30',
    deposit: 'bg-deposit/10 text-deposit border-deposit/30'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border tabular-nums ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
};
