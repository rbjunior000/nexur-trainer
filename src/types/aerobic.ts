export type IntensityZone = '1' | '2' | '3' | '4' | '5' | '5a' | '5b' | '5c';

export type DurationType = 'TIME' | 'DISTANCE';

export type Sport = 'running' | 'cycling' | 'swimming';

export interface BlockStep {
  id: string;
  name: string;
  durationType: DurationType;
  duration: string;
  intensity: IntensityZone;
  level: number;
}

export interface WorkoutBlock {
  id: string;
  name: string;
  repetitions: number;
  totalDuration: string;
  steps: BlockStep[];
}

export interface AerobicWorkout {
  workoutName: string;
  workoutStartDate: string;
  workoutEndDate: string;
  workoutDescription: string;
  sport: Sport;
  blocks: WorkoutBlock[];
}

export const INTENSITY_LABELS: Record<IntensityZone, string> = {
  '1': 'Zona 1',
  '2': 'Zona 2',
  '3': 'Zona 3',
  '4': 'Zona 4',
  '5': 'Zona 5',
  '5a': 'Zona 5a',
  '5b': 'Zona 5b',
  '5c': 'Zona 5c',
};

export const SPORT_LABELS: Record<Sport, string> = {
  running: 'Corrida',
  cycling: 'Ciclismo',
  swimming: 'Natação',
};

export const ZONE_COLORS: Record<IntensityZone, string> = {
  '1': 'bg-blue-500',
  '2': 'bg-teal-500',
  '3': 'bg-yellow-500',
  '4': 'bg-orange-500',
  '5': 'bg-red-500',
  '5a': 'bg-red-500',
  '5b': 'bg-red-600',
  '5c': 'bg-red-700',
};

export const DEFAULT_BLOCKS: WorkoutBlock[] = [
  {
    id: 'block-init-0',
    name: 'Aquecimento',
    repetitions: 1,
    totalDuration: '00:10:00',
    steps: [
      { id: 'step-init-0', name: 'Step 1', durationType: 'TIME', duration: '00:10:00', intensity: '1', level: 1 },
    ],
  },
  {
    id: 'block-init-1',
    name: 'Principal',
    repetitions: 3,
    totalDuration: '00:05:00',
    steps: [
      { id: 'step-init-1', name: 'Step 1', durationType: 'TIME', duration: '00:05:00', intensity: '3', level: 1 },
    ],
  },
  {
    id: 'block-init-2',
    name: 'Desaquecimento',
    repetitions: 1,
    totalDuration: '00:05:00',
    steps: [
      { id: 'step-init-2', name: 'Step 1', durationType: 'TIME', duration: '00:05:00', intensity: '1', level: 1 },
    ],
  },
];
