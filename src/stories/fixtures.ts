/**
 * Shared mock data for Storybook stories.
 * Not imported in production code.
 */
import type { StrictExercise } from '../types/workout';
import type { AerobicWorkout } from '../types/aerobic';

export const mockSet = {
  id: 'set-1',
  type: 'normal' as const,
  reps: 10,
  weight: 80,
  rest: 60,
  pse: null as null,
  duration: '00:30',
  distance: 0,
};

export const mockDropset = {
  id: 'drop-1',
  reps: 8,
  weight: 60,
};

export const mockExercise: StrictExercise = {
  id: 'ex-1',
  name: 'Supino Reto',
  category: 'Peito',
  equipment: '',
  media1: null,
  media2: null,
  type: 'weight_reps',
  repsMode: 'fixed',
  supersetWithNext: false,
  sets: [
    { id: 'set-1', type: 'warmup', reps: 15, weight: 40, rest: 30, pse: null, duration: '00:30', distance: 0 },
    { id: 'set-2', type: 'normal', reps: 10, weight: 80, rest: 60, pse: null, duration: '00:30', distance: 0 },
    { id: 'set-3', type: 'normal', reps: 10, weight: 80, rest: 60, pse: 7, duration: '00:30', distance: 0 },
    { id: 'set-4', type: 'normal', reps: 8, weight: 85, rest: 60, pse: null, duration: '00:30', distance: 0 },
  ],
  notes: '',
  orientacoes: 'Manter escápulas retraídas durante todo o movimento.',
};

export const mockExerciseDuration: StrictExercise = {
  ...mockExercise,
  id: 'ex-2',
  name: 'Prancha',
  type: 'duration',
  sets: [
    { id: 'set-d1', type: 'normal', reps: 0, weight: 0, rest: 30, pse: null, duration: '01:00', distance: 0 },
    { id: 'set-d2', type: 'normal', reps: 0, weight: 0, rest: 30, pse: null, duration: '01:00', distance: 0 },
  ],
};

export const mockExerciseWithDropset: StrictExercise = {
  ...mockExercise,
  id: 'ex-3',
  name: 'Rosca Direta',
  sets: [
    {
      id: 'set-drop-1',
      type: 'dropset',
      reps: 10,
      weight: 30,
      rest: 60,
      pse: null,
      duration: '00:30',
      distance: 0,
      dropsets: [
        { id: 'drop-1', reps: 8, weight: 25, duration: '00:30' },
        { id: 'drop-2', reps: 6, weight: 20, duration: '00:30' },
      ],
    },
  ],
};

export const mockRestExercise: StrictExercise = {
  id: 'rest-1',
  name: 'Descanso',
  category: '',
  equipment: '',
  media1: null,
  media2: null,
  type: 'rest',
  repsMode: 'fixed',
  supersetWithNext: false,
  sets: [],
  notes: '',
  restDuration: 60,
};

export const mockExerciseList: StrictExercise[] = [
  mockExercise,
  mockExerciseDuration,
  mockRestExercise,
];

export const mockAerobicWorkout: AerobicWorkout = {
  workoutName: 'Corrida Intervalada',
  workoutStartDate: '',
  workoutEndDate: '',
  workoutDescription: '',
  sport: 'running',
  blocks: [
    {
      id: 'b1',
      name: 'Aquecimento',
      repetitions: 1,
      totalDuration: '00:10:00',
      steps: [
        { id: 's1', name: 'Trote leve', durationType: 'TIME', duration: '00:10:00', intensity: '1', level: 1 },
      ],
    },
    {
      id: 'b2',
      name: 'Intervalados',
      repetitions: 3,
      totalDuration: '00:04:00',
      steps: [
        { id: 's2', name: 'Sprint', durationType: 'TIME', duration: '00:01:00', intensity: '5', level: 1 },
        { id: 's3', name: 'Recuperação', durationType: 'TIME', duration: '00:03:00', intensity: '2', level: 1 },
      ],
    },
    {
      id: 'b3',
      name: 'Desaquecimento',
      repetitions: 1,
      totalDuration: '00:05:00',
      steps: [
        { id: 's4', name: 'Caminhada', durationType: 'DISTANCE', duration: '500', intensity: '1', level: 1 },
      ],
    },
  ],
};
