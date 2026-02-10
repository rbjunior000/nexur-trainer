export type AutoplayItemType = 'exercise' | 'rest';

export interface AutoplayItem {
  id: string;
  type: AutoplayItemType;
  name: string;
  category: string;
  equipment: string;
  duration: number; // em segundos
  label: string;    // texto livre
}

export interface AutoplayWorkout {
  name: string;
  items: AutoplayItem[];
}

export const DURATION_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120] as const;

let _counter = 0;
function uid() {
  return `ap-${Date.now()}-${_counter++}`;
}

export function makeExerciseItem(name: string, category: string, equipment: string): AutoplayItem {
  return {
    id: uid(),
    type: 'exercise',
    name,
    category,
    equipment,
    duration: 30,
    label: '',
  };
}

export function makeRestItem(duration = 10): AutoplayItem {
  return {
    id: uid(),
    type: 'rest',
    name: 'Descanso',
    category: '',
    equipment: '',
    duration,
    label: '',
  };
}
