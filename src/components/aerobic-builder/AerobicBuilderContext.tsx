import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AerobicWorkout, WorkoutBlock, BlockStep } from '../../types/aerobic';
import { DEFAULT_BLOCKS } from '../../types/aerobic';

// ─── Context value ─────────────────────────────────────────────────────────────

export interface AerobicBuilderContextValue {
  workout: AerobicWorkout;

  // Workout meta
  updateMeta: (patch: Partial<Pick<AerobicWorkout, 'workoutName' | 'sport'>>) => void;

  // Block CRUD
  addBlock: () => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  updateBlock: (blockId: string, patch: Partial<WorkoutBlock>) => void;
  moveBlockUp: (blockId: string) => void;
  moveBlockDown: (blockId: string) => void;

  // Step CRUD
  addStep: (blockId: string) => void;
  removeStep: (blockId: string, stepId: string) => void;
  duplicateStep: (blockId: string, stepId: string) => void;
  updateStep: (blockId: string, stepId: string, patch: Partial<BlockStep>) => void;
}

// ─── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'UPDATE_META'; patch: Partial<Pick<AerobicWorkout, 'workoutName' | 'sport'>> }
  | { type: 'ADD_BLOCK' }
  | { type: 'REMOVE_BLOCK'; blockId: string }
  | { type: 'DUPLICATE_BLOCK'; blockId: string }
  | { type: 'UPDATE_BLOCK'; blockId: string; patch: Partial<WorkoutBlock> }
  | { type: 'MOVE_BLOCK_UP'; blockId: string }
  | { type: 'MOVE_BLOCK_DOWN'; blockId: string }
  | { type: 'ADD_STEP'; blockId: string }
  | { type: 'REMOVE_STEP'; blockId: string; stepId: string }
  | { type: 'DUPLICATE_STEP'; blockId: string; stepId: string }
  | { type: 'UPDATE_STEP'; blockId: string; stepId: string; patch: Partial<BlockStep> };

function uid() {
  return crypto.randomUUID();
}

function makeDefaultStep(): BlockStep {
  return {
    id: uid(),
    name: 'Step',
    durationType: 'TIME',
    duration: '00:05:00',
    intensity: '3',
    level: 1,
  };
}

function makeDefaultBlock(): WorkoutBlock {
  return {
    id: uid(),
    name: 'Bloco',
    repetitions: 1,
    totalDuration: '00:05:00',
    steps: [makeDefaultStep()],
  };
}

function reducer(state: AerobicWorkout, action: Action): AerobicWorkout {
  switch (action.type) {
    case 'UPDATE_META':
      return { ...state, ...action.patch };

    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, makeDefaultBlock()] };

    case 'REMOVE_BLOCK':
      return { ...state, blocks: state.blocks.filter((b) => b.id !== action.blockId) };

    case 'DUPLICATE_BLOCK': {
      const idx = state.blocks.findIndex((b) => b.id === action.blockId);
      if (idx === -1) return state;
      const clone: WorkoutBlock = {
        ...state.blocks[idx],
        id: uid(),
        name: state.blocks[idx].name + ' (cópia)',
        steps: state.blocks[idx].steps.map((s) => ({ ...s, id: uid() })),
      };
      const next = [...state.blocks];
      next.splice(idx + 1, 0, clone);
      return { ...state, blocks: next };
    }

    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.blockId ? { ...b, ...action.patch } : b,
        ),
      };

    case 'MOVE_BLOCK_UP': {
      const idx = state.blocks.findIndex((b) => b.id === action.blockId);
      if (idx <= 0) return state;
      const next = [...state.blocks];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return { ...state, blocks: next };
    }

    case 'MOVE_BLOCK_DOWN': {
      const idx = state.blocks.findIndex((b) => b.id === action.blockId);
      if (idx === -1 || idx >= state.blocks.length - 1) return state;
      const next = [...state.blocks];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return { ...state, blocks: next };
    }

    case 'ADD_STEP':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.blockId
            ? { ...b, steps: [...b.steps, makeDefaultStep()] }
            : b,
        ),
      };

    case 'REMOVE_STEP':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id === action.blockId
            ? { ...b, steps: b.steps.filter((s) => s.id !== action.stepId) }
            : b,
        ),
      };

    case 'DUPLICATE_STEP': {
      return {
        ...state,
        blocks: state.blocks.map((b) => {
          if (b.id !== action.blockId) return b;
          const idx = b.steps.findIndex((s) => s.id === action.stepId);
          if (idx === -1) return b;
          const clone = { ...b.steps[idx], id: uid() };
          const next = [...b.steps];
          next.splice(idx + 1, 0, clone);
          return { ...b, steps: next };
        }),
      };
    }

    case 'UPDATE_STEP':
      return {
        ...state,
        blocks: state.blocks.map((b) =>
          b.id !== action.blockId
            ? b
            : {
                ...b,
                steps: b.steps.map((s) =>
                  s.id === action.stepId ? { ...s, ...action.patch } : s,
                ),
              },
        ),
      };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AerobicBuilderContext = createContext<AerobicBuilderContextValue | null>(null);

export interface AerobicBuilderProviderProps {
  initialWorkout?: AerobicWorkout;
  children: ReactNode;
}

const DEFAULT_WORKOUT: AerobicWorkout = {
  workoutName: 'Treino Aeróbico',
  workoutStartDate: '',
  workoutEndDate: '',
  workoutDescription: '',
  sport: 'running',
  blocks: DEFAULT_BLOCKS,
};

/** Context Provider for the aerobic workout editor. */
export function AerobicBuilderProvider({
  initialWorkout = DEFAULT_WORKOUT,
  children,
}: AerobicBuilderProviderProps) {
  const [workout, dispatch] = useReducer(reducer, initialWorkout);

  const updateMeta = useCallback(
    (patch: Partial<Pick<AerobicWorkout, 'workoutName' | 'sport'>>) =>
      dispatch({ type: 'UPDATE_META', patch }),
    [],
  );
  const addBlock = useCallback(() => dispatch({ type: 'ADD_BLOCK' }), []);
  const removeBlock = useCallback((blockId: string) => dispatch({ type: 'REMOVE_BLOCK', blockId }), []);
  const duplicateBlock = useCallback((blockId: string) => dispatch({ type: 'DUPLICATE_BLOCK', blockId }), []);
  const updateBlock = useCallback((blockId: string, patch: Partial<WorkoutBlock>) => dispatch({ type: 'UPDATE_BLOCK', blockId, patch }), []);
  const moveBlockUp = useCallback((blockId: string) => dispatch({ type: 'MOVE_BLOCK_UP', blockId }), []);
  const moveBlockDown = useCallback((blockId: string) => dispatch({ type: 'MOVE_BLOCK_DOWN', blockId }), []);
  const addStep = useCallback((blockId: string) => dispatch({ type: 'ADD_STEP', blockId }), []);
  const removeStep = useCallback((blockId: string, stepId: string) => dispatch({ type: 'REMOVE_STEP', blockId, stepId }), []);
  const duplicateStep = useCallback((blockId: string, stepId: string) => dispatch({ type: 'DUPLICATE_STEP', blockId, stepId }), []);
  const updateStep = useCallback((blockId: string, stepId: string, patch: Partial<BlockStep>) => dispatch({ type: 'UPDATE_STEP', blockId, stepId, patch }), []);

  const value = useMemo<AerobicBuilderContextValue>(
    () => ({
      workout,
      updateMeta, addBlock, removeBlock, duplicateBlock, updateBlock, moveBlockUp, moveBlockDown,
      addStep, removeStep, duplicateStep, updateStep,
    }),
    [workout, updateMeta, addBlock, removeBlock, duplicateBlock, updateBlock, moveBlockUp, moveBlockDown,
     addStep, removeStep, duplicateStep, updateStep],
  );

  return (
    <AerobicBuilderContext.Provider value={value}>
      {children}
    </AerobicBuilderContext.Provider>
  );
}

export function useAerobicBuilder(): AerobicBuilderContextValue {
  const ctx = useContext(AerobicBuilderContext);
  if (!ctx) throw new Error('useAerobicBuilder must be inside <AerobicBuilderProvider>');
  return ctx;
}
