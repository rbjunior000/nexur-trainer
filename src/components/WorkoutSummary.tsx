import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';
import type { StrictExercise } from '../types/workout';

// ─── Muscle map ──────────────────────────────────────────────────────────────

const BODY_MAP: Record<string, Muscle[]> = {
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

// ─── Fitness radar ───────────────────────────────────────────────────────────

const RADAR_DIMS = [
  {
    label: 'Empurrar',
    cats: ['Peito', 'Tríceps', 'Ombro', 'Empurrar'],
  },
  {
    label: 'Puxar',
    cats: ['Costas', 'Bíceps', 'Antebraço', 'Pescoço', 'Puxar'],
  },
  {
    label: 'Core',
    cats: ['Abdominal', 'Centro (Core)', 'Controle Motor Estático', 'Controle Motor Dinâmico'],
  },
  {
    label: 'Pernas',
    cats: ['Perna', 'Glúteo', 'Panturrilha'],
  },
  {
    label: 'Mobilidade',
    cats: ['Mobilidade', 'Prehab', 'Auto Limite', 'Híbrido', 'Potência'],
  },
  {
    label: 'Cardio',
    cats: ['Aeróbico'],
  },
] as const;

function calcRadarData(exercises: StrictExercise[]) {
  const work = exercises.filter((ex) => ex.type !== 'rest');

  const raw = RADAR_DIMS.map((dim) => {
    const sets = work
      .filter((ex) => dim.cats.includes(ex.category as never))
      .reduce((sum, ex) => sum + (ex.sets?.length ?? 0), 0);
    return { label: dim.label, sets };
  });

  const max = Math.max(...raw.map((r) => r.sets), 1);

  return raw.map((r) => ({
    label: r.label,
    value: Math.round((r.sets / max) * 10),
    sets: r.sets,
  }));
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────

function RadarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { label: string; sets: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { label, sets } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="text-gray-500">{sets} {sets === 1 ? 'série' : 'séries'}</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WorkoutSummary({ exercises }: { exercises: StrictExercise[] }) {
  const workExercises = exercises.filter((ex) => ex.type !== 'rest');
  const totalSets     = workExercises.reduce((acc, ex) => acc + (ex.sets?.length ?? 0), 0);

  const bodyData: IExerciseData[] = workExercises
    .filter((ex) => BODY_MAP[ex.category ?? ''])
    .map((ex) => ({ name: ex.name, muscles: BODY_MAP[ex.category!] }));

  const muscleCategories = [...new Set(
    workExercises.map((ex) => ex.category).filter(Boolean).filter((c) => BODY_MAP[c!]),
  )];

  const radarData = calcRadarData(exercises);
  const hasRadarData = radarData.some((d) => d.sets > 0);

  if (workExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400 px-4 text-center">
        <span className="text-3xl">💪</span>
        <p className="text-sm">Adicione exercícios para ver o resumo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats */}
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

      {/* Fitness radar */}
      {hasRadarData && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">
            Perfil fitness
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
              <PolarGrid gridType="polygon" stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
              />
              <Radar
                dataKey="value"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.18}
                strokeWidth={2}
                dot={{ fill: '#f97316', strokeWidth: 0, r: 3 }}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Body map */}
      {bodyData.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Mapa muscular
          </p>
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center gap-1.5">
              <Model
                data={bodyData}
                type="anterior"
                highlightedColors={['#fed7aa', '#f97316', '#c2410c']}
                bodyColor="#e2e8f0"
                style={{ width: 96 }}
              />
              <span className="text-[11px] text-gray-400">Frente</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Model
                data={bodyData}
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

      {/* Muscle group chips */}
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
