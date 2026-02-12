import { useRef, type Dispatch, type SetStateAction } from 'react';
import { WorkoutHeader } from './WorkoutHeader';
import { AutoplayWorkout } from './AutoplayWorkout';
import { Edit2, Clock, Play, Layers } from 'lucide-react';
import type { LibraryExercise } from '../App';
import type { AutoplayItem, AutoplayBlock } from '../types/autoplay';
import { makeBlock } from '../types/autoplay';

export function AutoplayEditor({
  items,
  setItems,
  blocks,
  setBlocks,
  onRegisterAdd,
  onStartTraining,
}: {
  items: AutoplayItem[];
  setItems: Dispatch<SetStateAction<AutoplayItem[]>>;
  blocks: AutoplayBlock[];
  setBlocks: Dispatch<SetStateAction<AutoplayBlock[]>>;
  onRegisterAdd?: (fn: (ex: LibraryExercise) => void) => void;
  onStartTraining?: () => void;
}) {
  const addRestFnRef = useRef<(() => void) | null>(null);

  const handleCreateBlock = () => {
    if (items.length < 2) return;
    // Find consecutive loose items (no blockId) and group them all
    const looseIndices = items
      .map((it, i) => (!it.blockId ? i : -1))
      .filter((i) => i >= 0);
    if (looseIndices.length < 2) return;
    // Find first consecutive run of 2+ loose items
    let start = looseIndices[0];
    let end = start;
    for (let i = 1; i < looseIndices.length; i++) {
      if (looseIndices[i] === end + 1) {
        end = looseIndices[i];
      } else {
        if (end - start >= 1) break;
        start = looseIndices[i];
        end = start;
      }
    }
    if (end - start < 1) return;
    const block = makeBlock();
    setBlocks((prev) => [...prev, block]);
    setItems((prev) =>
      prev.map((it, i) =>
        i >= start && i <= end ? { ...it, blockId: block.id } : it
      )
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
      <WorkoutHeader />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Exercicios</h2>
          <div className="flex gap-3">
            <button
              onClick={() => addRestFnRef.current?.()}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Clock size={16} />
              Descanso
            </button>
            <button
              onClick={handleCreateBlock}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Layers size={16} />
              Criar bloco
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <Edit2 size={16} />
              Editar
            </button>
            <button
              onClick={() => {
                if (items.length > 0) onStartTraining?.();
              }}
              className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium transition-colors"
            >
              <Play size={16} />
              Iniciar
            </button>
          </div>
        </div>

        <AutoplayWorkout
          items={items}
          setItems={setItems}
          blocks={blocks}
          setBlocks={setBlocks}
          onRegisterAdd={onRegisterAdd}
          onRegisterAddRest={(fn) => { addRestFnRef.current = fn; }}
        />
      </div>
    </div>
  );
}
