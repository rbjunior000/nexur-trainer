export interface NumberInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  suffix?: string;
  className?: string;
  inputMode?: 'numeric' | 'decimal';
  variant?: 'light' | 'dark';
}

/**
 * Numeric input with optional suffix label.
 * - `variant="light"`: white background (editor)
 * - `variant="dark"`: dark background (execution)
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  placeholder = '0',
  suffix,
  className,
  inputMode = 'numeric',
  variant = 'light',
}: NumberInputProps) {
  const baseClass =
    variant === 'dark'
      ? 'w-full text-center bg-gray-800 text-white border border-gray-700 rounded-lg py-2 text-sm font-semibold focus:outline-none focus:border-yellow-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
      : 'w-full text-center bg-white border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <div className={`relative ${className ?? ''}`}>
      <input
        type="number"
        min={min}
        inputMode={inputMode}
        value={value ?? ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder}
        className={suffix ? `${baseClass} pr-7` : baseClass}
      />
      {suffix && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
