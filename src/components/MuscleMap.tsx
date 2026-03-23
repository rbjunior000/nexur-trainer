import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';

// Maps Nexur category text → react-body-highlighter muscle identifiers
const CATEGORY_MAP: Record<string, Muscle[]> = {
  'Abdominal':   ['abs'],
  'Bíceps':      ['biceps'],
  'Costas':      ['upper-back', 'trapezius', 'lower-back'],
  'Glúteo':      ['gluteal'],
  'Peito':       ['chest'],
  'Perna':       ['quadriceps', 'hamstring'],
  'Pescoço':     ['neck'],
  'Ombro':       ['front-deltoids', 'back-deltoids'],
  'Tríceps':     ['triceps'],
  'Antebraço':   ['forearm'],
  'Panturrilha': ['calves'],
};

export function MuscleMap({ category }: { category?: string | null }) {
  const muscles = category?.trim() ? (CATEGORY_MAP[category.trim()] ?? []) : [];

  if (muscles.length === 0) return null;

  const data: IExerciseData[] = [{ name: category!, muscles }];

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
        Grupos musculares
      </p>
      <div className="flex justify-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <Model
            data={data}
            type="anterior"
            highlightedColors={['#f97316']}
            bodyColor="#e2e8f0"
            style={{ width: 80 }}
          />
          <span className="text-[11px] text-gray-400">Frente</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Model
            data={data}
            type="posterior"
            highlightedColors={['#f97316']}
            bodyColor="#e2e8f0"
            style={{ width: 80 }}
          />
          <span className="text-[11px] text-gray-400">Costas</span>
        </div>
      </div>
    </div>
  );
}
