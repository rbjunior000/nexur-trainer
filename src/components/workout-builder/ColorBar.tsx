import { useState, useRef } from 'react';

export const NEXUR_COLORS = [
  '#f1f1f1',
  '#E45A33',
  '#FA761E',
  '#EF486E',
  '#4488FF',
  '#FF44AA',
  '#FDE84E',
  '#9AC53E',
  '#05D59E',
  '#5BBFEA',
  '#1089B1',
  '#06394A',
];

export interface ColorBarProps {
  color?: string;
  onChange: (hex: string) => void;
  /** Whether the popover opens to the side ('right') or below ('below'). */
  placement?: 'right' | 'below';
}

/**
 * A narrow color strip that opens a color picker popover on click.
 * Used for superset and exercise color tagging.
 */
export function ColorBar({ color, onChange, placement = 'right' }: ColorBarProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      if (placement === 'below') {
        setPos({ top: rect.bottom + 4, left: rect.left });
      } else {
        setPos({ top: rect.top, left: rect.right + 8 });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div className="flex-shrink-0 h-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        title="Cor do exercício"
        className="h-full w-2.5 rounded-lg cursor-pointer focus:outline-none"
        style={{ background: color || '#e5e7eb' }}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="fixed z-40 bg-white rounded-xl shadow-xl border border-gray-100 p-2"
            style={{ top: pos.top, left: pos.left }}
          >
            <div className="grid grid-cols-4 gap-1.5">
              {NEXUR_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    onChange(hex);
                    setOpen(false);
                  }}
                  className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 focus:outline-none"
                  style={{
                    background: hex,
                    borderColor: color === hex ? '#374151' : 'transparent',
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
