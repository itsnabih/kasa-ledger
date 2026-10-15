import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  className = '',
  children,
  ...rest
}) => {
  const paddingMap: Record<NonNullable<CardProps['padding']>, string> = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6'
  };

  return (
    <div
      className={`bg-surface border border-border rounded-xl ${paddingMap[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
