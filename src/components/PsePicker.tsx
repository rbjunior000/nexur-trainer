import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export const PSE_OPTIONS = [
  { value: 6,  label: 'Leve',         sub: '~4 reps sobrando' },
  { value: 7,  label: 'Moderado',     sub: '~3 reps sobrando' },
  { value: 8,  label: 'Pesado',       sub: '~2 reps sobrando' },
  { value: 9,  label: 'Muito pesado', sub: '~1 rep sobrando'  },
  { value: 10, label: 'Falha',        sub: '0 reps sobrando'  },
] as const;


function PseModal({
  value,
  onSelect,
  onClose,
}: {
  value?: number | null;
  onSelect: (v: number | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl md:max-h-[90vh] flex flex-col shadow-xl">

        {/* Handle — mobile only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Selecionar PSE</h2>
            <p className="text-sm text-gray-500 mt-0.5">Percepção Subjetiva de Esforço</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-2">
          {value != null && value > 0 && (
            <button
              onClick={() => { onSelect(null); onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-3xl font-bold w-10 text-center flex-shrink-0 text-gray-300">—</span>
              <span className="text-sm text-gray-400">Limpar seleção</span>
            </button>
          )}
          {PSE_OPTIONS.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { onSelect(opt.value); onClose(); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 transition-all text-left ${
                  selected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className={`text-4xl font-bold w-10 text-center flex-shrink-0 leading-none tabular-nums ${selected ? 'text-blue-600' : 'text-gray-800'}`}>
                  {opt.value}
                </span>
                <div>
                  <p className="font-bold text-base text-gray-900 leading-tight">{opt.label}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{opt.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PseBadgeWithPicker({
  value,
  onChange,
}: {
  value?: number | null;
  onChange: (v: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasValue = value != null && value > 0;
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="PSE - Percepção Subjetiva de Esforço"
        className={`w-9 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
          hasValue
            ? 'bg-blue-100 text-blue-600 border border-blue-300'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        {hasValue ? value : '—'}
      </button>
      {open && createPortal(
        <PseModal value={value} onSelect={onChange} onClose={() => setOpen(false)} />,
        document.body
      )}
    </>
  );
}
