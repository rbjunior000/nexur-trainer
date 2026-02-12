export type ExerciseType =
'weight_reps' |
'duration' |
'distance' |
'rest';

export interface Exercise {
  id: string;
  name: string;
  thumbnail: string;
  category: string;
  equipment: string;
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

export interface StrictSet {
  id: string;
  reps?: number;
  repsRange?: [number, number];
  weight?: number;
  duration?: string;
  distance?: number;
  rest: number; // seconds (0 = OFF)
}

export interface StrictExercise extends Exercise {
  type: ExerciseType;
  repsMode: RepsMode;
  sets: StrictSet[];
  restDuration?: number; // seconds (0 = OFF), used only when type='rest'
  notes: string;
  supersetWithNext: boolean;
}

let _typeIdCounter = 0;
export function makeRestExercise(duration?: number): StrictExercise {
  return {
    id: `rest_${++_typeIdCounter}_${Date.now()}`,
    name: 'Descanso',
    thumbnail: '',
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