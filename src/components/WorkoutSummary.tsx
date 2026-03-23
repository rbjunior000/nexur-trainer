import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';
import type { StrictExercise } from '../types/workout';

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

export function WorkoutSummary({ exercises }: { exercises: StrictExercise[] }) {
  const workExercises = exercises.filter((ex) => ex.type !== 'rest');

  const data: IExerciseData[] = workExercises
    .filter((ex) => CATEGORY_MAP[ex.category ?? ''])
    .map((ex) => ({
      name: ex.name,
      muscles: CATEGORY_MAP[ex.category!],
    }));

  const totalSets = workExercises.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0);

  // Unique muscle group categories present
  const muscleCategories = [...new Set(
    workExercises.map((ex) => ex.category).filter(Boolean).filter((c) => CATEGORY_MAP[c!])
  )];

  if (workExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400 px-4 text-center">
        <span className="text-3xl">💪</span>
        <p className="text-sm">Adicione exercícios para ver o resumo.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{workExercises.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Exercícios</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{totalSets}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Séries</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{muscleCategories.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Grupos</p>
        </div>
      </div>

      {/* Muscle map */}
      {data.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Mapa muscular
          </p>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <Model
                data={data}
                type="anterior"
                highlightedColors={['#fed7aa', '#f97316', '#c2410c']}
                bodyColor="#e2e8f0"
                style={{ width: 96 }}
              />
              <span className="text-[11px] text-gray-400">Frente</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Model
                data={data}
                type="posterior"
                highlightedColors={['#fed7aa', '#f97316', '#c2410c']}
                bodyColor="#e2e8f0"
                style={{ width: 96 }}
              />
              <span className="text-[11px] text-gray-400">Costas</span>
            </div>
          </div>
        </div>
      )}

      {/* Muscle groups list */}
      {muscleCategories.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            Grupos musculares
          </p>
          <div className="flex flex-wrap gap-1.5">
            {muscleCategories.map((cat) => (
              <span
                key={cat}
                className="text-xs bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-full font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
