export type ExerciseType =
'weight_reps' |
'reps_only' |
'weighted_bodyweight' |
'assisted_bodyweight' |
'duration' |
'weight_duration' |
'distance_duration' |
'weight_distance';

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
export interface StrictSet {
  id: string;
  reps?: number;
  weight?: number;
  duration?: string;
  distance?: number;
  // restTime removed from here
}

export interface StrictExercise extends Exercise {
  type: ExerciseType;
  sets: StrictSet[];
  restTime: string;
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