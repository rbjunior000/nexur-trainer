import { Media } from './media';
export type { Media };

export type ExerciseType =
'weight_reps' |
'duration' |
'distance' |
'rest';

export interface Exercise {
  id: string;
  name: string;
  media1: Media | null;
  media2: Media | null;
  category: string;
  equipment: string;
  orientacoes?: string;
}

// Flex Workout Types
export interface FlexExercise extends Exercise {
  methodology: string;
  reps: string;
  load: string;
  interval: string;
  notes: string;
}

// Strict Workout Types
export type RepsMode = 'fixed' | 'range';

export type SetType = 'normal' | 'warmup' | 'dropset';

export interface DropSet {
  id: string;
  reps?: number;
  repsRange?: [number, number];
  weight?: number;
  duration?: string;
  distance?: number;
}

export interface StrictSet {
  id: string;
  type?: SetType;        // default 'normal' when undefined
  dropsets?: DropSet[];  // only used when type === 'dropset'
  reps?: number;
  repsRange?: [number, number];
  weight?: number;
  duration?: string;
  distance?: number;
  rest: number; // seconds (0 = OFF)
  pse?: number | null;   // Percepção Subjetiva de Esforço (1-10)
}

export interface StrictExercise extends Exercise {
  type: ExerciseType;
  repsMode: RepsMode;
  sets: StrictSet[];
  restDuration?: number; // seconds (0 = OFF), used only when type='rest'
  notes: string;
  supersetWithNext: boolean;
  cor?: string;
}

let _typeIdCounter = 0;

export function makeStrictExercise(
  partial: Partial<StrictExercise> & { name: string; type: ExerciseType },
): StrictExercise {
  return {
    id: crypto.randomUUID(),
    name: partial.name,
    media1: partial.media1 ?? null,
    media2: partial.media2 ?? null,
    category: partial.category ?? '',
    equipment: partial.equipment ?? '',
    orientacoes: partial.orientacoes,
    type: partial.type,
    repsMode: partial.repsMode ?? 'fixed',
    sets: partial.sets ?? [
      { id: crypto.randomUUID(), type: 'normal', reps: 10, weight: 0, rest: 60, pse: null },
    ],
    restDuration: partial.restDuration,
    notes: partial.notes ?? '',
    supersetWithNext: partial.supersetWithNext ?? false,
    cor: partial.cor,
  };
}

export function makeRestExercise(duration?: number): StrictExercise {
  return {
    id: `rest_${++_typeIdCounter}_${Date.now()}`,
    name: 'Descanso',
    media1: null,
    media2: null,
    category: '',
    equipment: '',
    type: 'rest',
    repsMode: 'fixed',
    sets: [],
    restDuration: duration ?? 60,
    notes: '',
    supersetWithNext: false,
  };
}

// Cardio Workout Types
export type CardioActivityType =
'running' |
'cycling' |
'swimming' |
'rowing' |
'walking' |
'hiking';

export interface CardioInterval {
  id: string;
  type: 'warmup' | 'work' | 'rest' | 'cooldown';
  duration: string;
  intensity?: string;
}

export interface CardioSession {
  activityType: CardioActivityType;
  targetType: 'duration' | 'distance';
  targetValue: string; // "00:30:00" or "5km"
  intervals: CardioInterval[];
  notes: string;
  heartRateZone?: number;
}