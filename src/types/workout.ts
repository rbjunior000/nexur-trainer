export type ExerciseType =
'weight_reps' |
'duration' |
'distance';

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
  rest: string;
}

export interface StrictExercise extends Exercise {
  type: ExerciseType;
  repsMode: RepsMode;
  sets: StrictSet[];
  restAfterExercise: string;
  notes: string;
  supersetWithNext: boolean;
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