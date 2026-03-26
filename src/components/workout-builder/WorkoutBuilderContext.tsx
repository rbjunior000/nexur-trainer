import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  StrictExercise,
  StrictSet,
  SetType,
  DropSet,
  ExerciseType,
  RepsMode,
} from '../../types/workout';
import { makeRestExercise } from '../../types/workout';

// ─── Public types ──────────────────────────────────────────────────────────────

export interface FillForm {
  type: ExerciseType | null;
  setType: SetType | null;
  numSets: number | null;
  repsMode: RepsMode | null;
  weight: number | null;
  reps: number | null;
  repsMin: number | null;
  repsMax: number | null;
  duration: string | null;
  distance: number | null;
  rest: number | null;
  notes: string | null;
}

export interface WorkoutBuilderContextValue {
  exercises: StrictExercise[];
  bulkMode: boolean;
  selectedIds: Set<string>;

  // Exercise CRUD
  addExercise: (ex: StrictExercise) => void;
  removeExercise: (id: string) => void;
  duplicateExercise: (id: string) => void;
  updateExercise: (id: string, patch: Partial<StrictExercise>) => void;
  setExercises: (exercises: StrictExercise[]) => void;

  // Set CRUD
  addSet: (exerciseId: string, defaults?: Partial<StrictSet>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  duplicateSet: (exerciseId: string, setId: string) => void;
  updateSet: (exerciseId: string, setId: string, field: keyof StrictSet, value: unknown) => void;

  // Dropset CRUD
  addDropset: (exerciseId: string, setId: string) => void;
  removeDropset: (exerciseId: string, setId: string, dropId: string) => void;
  updateDropset: (
    exerciseId: string,
    setId: string,
    dropId: string,
    field: keyof DropSet,
    value: unknown,
  ) => void;

  // Superset
  toggleSuperset: (id: string) => void;
  unlinkSuperset: (id: string) => void;
  addRestAfter: (id: string) => void;

  // Bulk operations
  enterBulkMode: () => void;
  exitBulkMode: () => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  clearSelected: () => void;
  applyFill: (form: FillForm) => void;
  bulkRemove: () => void;
  bulkClear: () => void;
}

// ─── Internal state ────────────────────────────────────────────────────────────

interface State {
  exercises: StrictExercise[];
  bulkMode: boolean;
  selectedIds: Set<string>;
}

type Action =
  | { type: 'SET_EXERCISES'; exercises: StrictExercise[] }
  | { type: 'ADD_EXERCISE'; exercise: StrictExercise }
  | { type: 'REMOVE_EXERCISE'; id: string }
  | { type: 'DUPLICATE_EXERCISE'; id: string }
  | { type: 'UPDATE_EXERCISE'; id: string; patch: Partial<StrictExercise> }
  | { type: 'ADD_SET'; exerciseId: string; defaults?: Partial<StrictSet> }
  | { type: 'REMOVE_SET'; exerciseId: string; setId: string }
  | { type: 'DUPLICATE_SET'; exerciseId: string; setId: string }
  | { type: 'UPDATE_SET'; exerciseId: string; setId: string; field: keyof StrictSet; value: unknown }
  | { type: 'ADD_DROPSET'; exerciseId: string; setId: string }
  | { type: 'REMOVE_DROPSET'; exerciseId: string; setId: string; dropId: string }
  | { type: 'UPDATE_DROPSET'; exerciseId: string; setId: string; dropId: string; field: keyof DropSet; value: unknown }
  | { type: 'TOGGLE_SUPERSET'; id: string }
  | { type: 'UNLINK_SUPERSET'; id: string }
  | { type: 'ADD_REST_AFTER'; id: string }
  | { type: 'ENTER_BULK' }
  | { type: 'EXIT_BULK' }
  | { type: 'TOGGLE_SELECTED'; id: string }
  | { type: 'SELECT_ALL' }
  | { type: 'CLEAR_SELECTED' }
  | { type: 'APPLY_FILL'; form: FillForm }
  | { type: 'BULK_REMOVE' }
  | { type: 'BULK_CLEAR' };

function uid() {
  return crypto.randomUUID();
}

function cloneExercise(ex: StrictExercise): StrictExercise {
  return {
    ...ex,
    id: uid(),
    name: ex.name + ' (cópia)',
    supersetWithNext: false,
    sets: ex.sets.map((s) => ({ ...s, id: uid() })),
  };
}

function makeDefaultSet(prev?: StrictSet): StrictSet {
  return {
    id: uid(),
    type: 'normal',
    reps: prev?.reps ?? 10,
    repsRange: prev?.repsRange,
    weight: prev?.weight ?? 0,
    duration: prev?.duration ?? '00:00',
    distance: prev?.distance ?? 0,
    rest: prev?.rest ?? 60,
    pse: null,
  };
}

function applyFillToExercise(ex: StrictExercise, form: FillForm): StrictExercise {
  if (ex.type === 'rest') return ex;
  if (form.type && ex.type !== form.type) return ex;

  const updatedEx: StrictExercise = { ...ex };
  if (form.repsMode) updatedEx.repsMode = form.repsMode;
  if (form.notes !== null) updatedEx.notes = form.notes;

  const targetCount = form.numSets ?? ex.sets.length;
  const baseSet = ex.sets[0];

  const makeFilled = (existing?: StrictSet): StrictSet => {
    const base = existing ?? makeDefaultSet();
    const s: StrictSet = { ...base, id: existing?.id ?? uid() };
    if (form.setType) s.type = form.setType;
    if (form.weight !== null) s.weight = form.weight;
    if (form.reps !== null) s.reps = form.reps;
    if (form.repsMin !== null && form.repsMax !== null)
      s.repsRange = [form.repsMin, form.repsMax];
    if (form.duration !== null) s.duration = form.duration;
    if (form.distance !== null) s.distance = form.distance;
    if (form.rest !== null) s.rest = form.rest;
    return s;
  };

  if (targetCount === ex.sets.length) {
    updatedEx.sets = ex.sets.map((s) => makeFilled(s));
  } else if (targetCount > ex.sets.length) {
    updatedEx.sets = [
      ...ex.sets.map((s) => makeFilled(s)),
      ...Array.from({ length: targetCount - ex.sets.length }, () =>
        makeFilled(baseSet),
      ),
    ];
  } else {
    updatedEx.sets = ex.sets.slice(0, targetCount).map((s) => makeFilled(s));
  }

  return updatedEx;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_EXERCISES':
      return { ...state, exercises: action.exercises };

    case 'ADD_EXERCISE':
      return { ...state, exercises: [...state.exercises, action.exercise] };

    case 'REMOVE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.filter((e) => e.id !== action.id),
      };

    case 'DUPLICATE_EXERCISE': {
      const idx = state.exercises.findIndex((e) => e.id === action.id);
      if (idx === -1) return state;
      const clone = cloneExercise(state.exercises[idx]);
      const next = [...state.exercises];
      next.splice(idx + 1, 0, clone);
      return { ...state, exercises: next };
    }

    case 'UPDATE_EXERCISE':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.id ? { ...e, ...action.patch } : e,
        ),
      };

    case 'ADD_SET': {
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.id !== action.exerciseId) return e;
          const prev = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, makeDefaultSet(prev)],
          };
        }),
      };
    }

    case 'REMOVE_SET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.exerciseId
            ? { ...e, sets: e.sets.filter((s) => s.id !== action.setId) }
            : e,
        ),
      };

    case 'DUPLICATE_SET': {
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.id !== action.exerciseId) return e;
          const idx = e.sets.findIndex((s) => s.id === action.setId);
          if (idx === -1) return e;
          const clone = { ...e.sets[idx], id: uid() };
          const next = [...e.sets];
          next.splice(idx + 1, 0, clone);
          return { ...e, sets: next };
        }),
      };
    }

    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.exerciseId
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.id === action.setId ? { ...s, [action.field]: action.value } : s,
                ),
              }
            : e,
        ),
      };

    case 'ADD_DROPSET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id !== action.exerciseId
            ? e
            : {
                ...e,
                sets: e.sets.map((s) =>
                  s.id !== action.setId
                    ? s
                    : {
                        ...s,
                        type: 'dropset' as const,
                        dropsets: [
                          ...(s.dropsets ?? []),
                          { id: uid(), reps: s.reps, weight: s.weight, duration: s.duration },
                        ],
                      },
                ),
              },
        ),
      };

    case 'REMOVE_DROPSET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id !== action.exerciseId
            ? e
            : {
                ...e,
                sets: e.sets.map((s) => {
                  if (s.id !== action.setId) return s;
                  const remaining = (s.dropsets ?? []).filter((d) => d.id !== action.dropId);
                  return remaining.length === 0
                    ? { ...s, type: 'normal' as const, dropsets: undefined }
                    : { ...s, dropsets: remaining };
                }),
              },
        ),
      };

    case 'UPDATE_DROPSET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id !== action.exerciseId
            ? e
            : {
                ...e,
                sets: e.sets.map((s) =>
                  s.id !== action.setId
                    ? s
                    : {
                        ...s,
                        dropsets: (s.dropsets ?? []).map((d) =>
                          d.id === action.dropId ? { ...d, [action.field]: action.value } : d,
                        ),
                      },
                ),
              },
        ),
      };

    case 'TOGGLE_SUPERSET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.id ? { ...e, supersetWithNext: !e.supersetWithNext } : e,
        ),
      };

    case 'UNLINK_SUPERSET': {
      const idx = state.exercises.findIndex((e) => e.id === action.id);
      if (idx === -1) return state;
      const next = [...state.exercises];
      // Unlink the exercise itself and the one before it
      next[idx] = { ...next[idx], supersetWithNext: false };
      if (idx > 0) next[idx - 1] = { ...next[idx - 1], supersetWithNext: false };
      return { ...state, exercises: next };
    }

    case 'ADD_REST_AFTER': {
      const idx = state.exercises.findIndex((e) => e.id === action.id);
      if (idx === -1) return state;
      const rest = makeRestExercise();
      const next = [...state.exercises];
      next.splice(idx + 1, 0, rest);
      return { ...state, exercises: next };
    }

    case 'ENTER_BULK':
      return { ...state, bulkMode: true, selectedIds: new Set() };

    case 'EXIT_BULK':
      return { ...state, bulkMode: false, selectedIds: new Set() };

    case 'TOGGLE_SELECTED': {
      const next = new Set(state.selectedIds);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedIds: next };
    }

    case 'SELECT_ALL': {
      const all = state.exercises
        .filter((e) => e.type !== 'rest')
        .map((e) => e.id);
      return { ...state, selectedIds: new Set(all) };
    }

    case 'CLEAR_SELECTED':
      return { ...state, selectedIds: new Set() };

    case 'APPLY_FILL':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          state.selectedIds.has(e.id) ? applyFillToExercise(e, action.form) : e,
        ),
      };

    case 'BULK_REMOVE':
      return {
        ...state,
        exercises: state.exercises.filter((e) => !state.selectedIds.has(e.id)),
        bulkMode: false,
        selectedIds: new Set(),
      };

    case 'BULK_CLEAR':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          state.selectedIds.has(e.id) ? { ...e, sets: [], notes: '' } : e,
        ),
        selectedIds: new Set(),
      };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

const WorkoutBuilderContext = createContext<WorkoutBuilderContextValue | null>(null);

export interface WorkoutBuilderProviderProps {
  initialExercises?: StrictExercise[];
  children: ReactNode;
}

/** Context Provider for the workout editor. Wrap the editor tree with this. */
export function WorkoutBuilderProvider({
  initialExercises = [],
  children,
}: WorkoutBuilderProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    exercises: initialExercises,
    bulkMode: false,
    selectedIds: new Set<string>(),
  });

  const addExercise = useCallback((ex: StrictExercise) => dispatch({ type: 'ADD_EXERCISE', exercise: ex }), []);
  const removeExercise = useCallback((id: string) => dispatch({ type: 'REMOVE_EXERCISE', id }), []);
  const duplicateExercise = useCallback((id: string) => dispatch({ type: 'DUPLICATE_EXERCISE', id }), []);
  const updateExercise = useCallback((id: string, patch: Partial<StrictExercise>) => dispatch({ type: 'UPDATE_EXERCISE', id, patch }), []);
  const setExercises = useCallback((exercises: StrictExercise[]) => dispatch({ type: 'SET_EXERCISES', exercises }), []);

  const addSet = useCallback((exerciseId: string, defaults?: Partial<StrictSet>) => dispatch({ type: 'ADD_SET', exerciseId, defaults }), []);
  const removeSet = useCallback((exerciseId: string, setId: string) => dispatch({ type: 'REMOVE_SET', exerciseId, setId }), []);
  const duplicateSet = useCallback((exerciseId: string, setId: string) => dispatch({ type: 'DUPLICATE_SET', exerciseId, setId }), []);
  const updateSet = useCallback((exerciseId: string, setId: string, field: keyof StrictSet, value: unknown) => dispatch({ type: 'UPDATE_SET', exerciseId, setId, field, value }), []);

  const addDropset = useCallback((exerciseId: string, setId: string) => dispatch({ type: 'ADD_DROPSET', exerciseId, setId }), []);
  const removeDropset = useCallback((exerciseId: string, setId: string, dropId: string) => dispatch({ type: 'REMOVE_DROPSET', exerciseId, setId, dropId }), []);
  const updateDropset = useCallback((exerciseId: string, setId: string, dropId: string, field: keyof DropSet, value: unknown) => dispatch({ type: 'UPDATE_DROPSET', exerciseId, setId, dropId, field, value }), []);

  const toggleSuperset = useCallback((id: string) => dispatch({ type: 'TOGGLE_SUPERSET', id }), []);
  const unlinkSuperset = useCallback((id: string) => dispatch({ type: 'UNLINK_SUPERSET', id }), []);
  const addRestAfter = useCallback((id: string) => dispatch({ type: 'ADD_REST_AFTER', id }), []);

  const enterBulkMode = useCallback(() => dispatch({ type: 'ENTER_BULK' }), []);
  const exitBulkMode = useCallback(() => dispatch({ type: 'EXIT_BULK' }), []);
  const toggleSelected = useCallback((id: string) => dispatch({ type: 'TOGGLE_SELECTED', id }), []);
  const selectAll = useCallback(() => dispatch({ type: 'SELECT_ALL' }), []);
  const clearSelected = useCallback(() => dispatch({ type: 'CLEAR_SELECTED' }), []);
  const applyFill = useCallback((form: FillForm) => dispatch({ type: 'APPLY_FILL', form }), []);
  const bulkRemove = useCallback(() => dispatch({ type: 'BULK_REMOVE' }), []);
  const bulkClear = useCallback(() => dispatch({ type: 'BULK_CLEAR' }), []);

  const value = useMemo<WorkoutBuilderContextValue>(
    () => ({
      exercises: state.exercises,
      bulkMode: state.bulkMode,
      selectedIds: state.selectedIds,
      addExercise,
      removeExercise,
      duplicateExercise,
      updateExercise,
      setExercises,
      addSet,
      removeSet,
      duplicateSet,
      updateSet,
      addDropset,
      removeDropset,
      updateDropset,
      toggleSuperset,
      unlinkSuperset,
      addRestAfter,
      enterBulkMode,
      exitBulkMode,
      toggleSelected,
      selectAll,
      clearSelected,
      applyFill,
      bulkRemove,
      bulkClear,
    }),
    [
      state,
      addExercise, removeExercise, duplicateExercise, updateExercise, setExercises,
      addSet, removeSet, duplicateSet, updateSet,
      addDropset, removeDropset, updateDropset,
      toggleSuperset, unlinkSuperset, addRestAfter,
      enterBulkMode, exitBulkMode, toggleSelected, selectAll, clearSelected, applyFill, bulkRemove, bulkClear,
    ],
  );

  return (
    <WorkoutBuilderContext.Provider value={value}>
      {children}
    </WorkoutBuilderContext.Provider>
  );
}

/** Consume the WorkoutBuilder context. Must be inside a <WorkoutBuilderProvider>. */
export function useWorkoutBuilder(): WorkoutBuilderContextValue {
  const ctx = useContext(WorkoutBuilderContext);
  if (!ctx) throw new Error('useWorkoutBuilder must be used inside <WorkoutBuilderProvider>');
  return ctx;
}
