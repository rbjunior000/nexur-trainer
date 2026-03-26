import { useState } from 'react';
import IMask from 'imask';
import { IMaskInput } from 'react-imask';
import type { ExerciseType, SetType } from '../../types/workout';
import type { FillForm } from './WorkoutBuilderContext';
import { BaseModal } from '../shared/BaseModal';

const INPUT_CLS =
  'w-full text-center bg-gray-50 border border-gray-200 rounded-lg py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400';

function NumInput({
  val,
  onChange,
  placeholder,
}: {
  val: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      min={0}
      value={val ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      placeholder={placeholder}
      className={INPUT_CLS}
    />
  );
}

function ToggleBtn<T extends string>({
  value: _value,
  active,
  label,
  onClick,
}: {
  value: T;
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
        active
          ? 'bg-yellow-400 border-yellow-400 text-gray-900'
          : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

export interface FillModalProps {
  open: boolean;
  onApply: (form: FillForm) => void;
  onClose: () => void;
}

/**
 * Bulk fill modal — lets the user preset type, set count, weight, reps, rest
 * and apply to all selected exercises at once.
 */
export function FillModal({ open, onApply, onClose }: FillModalProps) {
  const [type, setType] = useState<ExerciseType | null>(null);
  const [serieType, setSerieType] = useState<SetType | null>(null);
  const [numSets, setNumSets] = useState<number | null>(null);
  const [repsMode, setRepsMode] = useState<'fixed' | 'range' | null>(null);
  const [weight, setWeight] = useState<number | null>(null);
  const [reps, setReps] = useState<number | null>(null);
  const [repsMin, setRepsMin] = useState<number | null>(null);
  const [repsMax, setRepsMax] = useState<number | null>(null);
  const [durationEnabled, setDurationEnabled] = useState(false);
  const [duration, setDuration] = useState('00:30');
  const [distance, _setDistance] = useState<number | null>(null);
  const [rest, setRest] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const toggle = <T extends string>(
    cur: T | null,
    val: T,
    set: (v: T | null) => void,
  ) => set(cur === val ? null : val);

  const handleApply = () => {
    onApply({
      type,
      setType: serieType,
      numSets,
      repsMode,
      weight,
      reps,
      repsMin,
      repsMax,
      duration: durationEnabled ? duration : null,
      distance,
      rest,
      notes: notes !== '' ? notes : null,
    });
    onClose();
  };

  return (
    <BaseModal open={open} onClose={onClose} title="Preencher séries" className="max-w-md">
      <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
        {/* Type filter */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tipo</p>
          <div className="flex gap-2">
            {(['weight_reps', 'duration', 'distance'] as ExerciseType[]).map((t) => (
              <ToggleBtn
                key={t}
                value={t}
                active={type === t}
                label={({ weight_reps: 'Peso', duration: 'Duração', distance: 'Dist.' } as Record<string, string>)[t] ?? t}
                onClick={() => toggle(type, t, setType)}
              />
            ))}
          </div>
        </div>

        {/* Set type */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Tipo de série</p>
          <div className="flex gap-2">
            {(['normal', 'warmup', 'dropset'] as SetType[]).map((t) => (
              <ToggleBtn
                key={t}
                value={t}
                active={serieType === t}
                label={{ normal: 'Normal', warmup: 'Aquec.', dropset: 'Drop' }[t]}
                onClick={() => toggle(serieType, t, setSerieType)}
              />
            ))}
          </div>
        </div>

        {/* Num sets */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Nº de séries</p>
          <NumInput val={numSets} onChange={setNumSets} placeholder="manter" />
        </div>

        {/* Weight */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Carga (kg)</p>
          <NumInput val={weight} onChange={setWeight} placeholder="manter" />
        </div>

        {/* Reps */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Repetições</p>
          <div className="flex gap-2 mb-2">
            {(['fixed', 'range'] as const).map((m) => (
              <ToggleBtn
                key={m}
                value={m}
                active={repsMode === m}
                label={m === 'fixed' ? 'Fixo' : 'Faixa'}
                onClick={() => toggle(repsMode, m, setRepsMode)}
              />
            ))}
          </div>
          {repsMode === 'range' ? (
            <div className="flex items-center gap-2">
              <NumInput val={repsMin} onChange={setRepsMin} placeholder="mín" />
              <span className="text-gray-400">-</span>
              <NumInput val={repsMax} onChange={setRepsMax} placeholder="máx" />
            </div>
          ) : (
            <NumInput val={reps} onChange={setReps} placeholder="manter" />
          )}
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-gray-400 uppercase">Duração</p>
            <button
              type="button"
              onClick={() => setDurationEnabled((v) => !v)}
              className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                durationEnabled ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {durationEnabled ? 'ativo' : 'ignorar'}
            </button>
          </div>
          {durationEnabled && (
            <IMaskInput
              mask="MM:SS"
              blocks={{
                MM: { mask: IMask.MaskedRange, from: 0, to: 99, maxLength: 2, placeholderChar: '0' },
                SS: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2, placeholderChar: '0' },
              }}
              lazy={false}
              overwrite
              value={duration}
              onAccept={(val: string) => setDuration(val)}
              inputMode="numeric"
              className={`${INPUT_CLS} tabular-nums`}
            />
          )}
        </div>

        {/* Rest */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Descanso (seg)</p>
          <NumInput val={rest} onChange={setRest} placeholder="manter" />
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Observações</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Deixar vazio para manter"
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-yellow-400 resize-none h-16"
          />
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 py-3 rounded-xl bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-500 transition-colors"
        >
          Aplicar
        </button>
      </div>
    </BaseModal>
  );
}
