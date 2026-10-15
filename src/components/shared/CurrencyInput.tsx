import React, { useCallback } from 'react';
import { formatNumberWithDots, parseDigitsToInteger } from '../../lib/formatters';

export interface CurrencyInputProps {
  id?: string;
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  quickAmounts?: readonly number[];
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = '0',
  helperText,
  error,
  required = false,
  quickAmounts
}) => {
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseDigitsToInteger(e.target.value);
      onChange(parsed);
    },
    [onChange]
  );

  const displayValue = value > 0 ? formatNumberWithDots(value) : '';

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-text-secondary"
      >
        {label} {required ? <span className="text-expense">*</span> : null}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3.5 text-sm font-semibold text-text-secondary select-none">
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required={required}
          value={displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full min-h-[46px] pl-10 pr-4 py-2.5 bg-subtle border border-border rounded-lg text-base font-semibold text-text-primary tabular-nums focus:outline-none focus:border-brand focus:bg-surface transition-colors"
        />
      </div>

      {quickAmounts && quickAmounts.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => onChange(amt)}
              className="px-2.5 py-1.5 min-h-[36px] text-xs font-medium bg-subtle hover:bg-border/60 text-text-secondary hover:text-text-primary border border-border rounded-md tabular-nums touch-manipulation transition-colors"
            >
              Rp {formatNumberWithDots(amt)}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-expense font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
};
