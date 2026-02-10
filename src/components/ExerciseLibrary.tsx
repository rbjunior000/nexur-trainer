import { useState } from 'react';
import { Search, Filter, Plus, Check, Dumbbell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LibraryExercise } from '../App';

const MOCK_EXERCISES = [
  { id: '1', name: '90/90 com Rotação', category: 'Mobilidade', equipment: 'Chão', color: 'bg-green-100' },
  { id: '2', name: 'Supino Reto', category: 'Peito', equipment: 'Barra', color: 'bg-blue-100' },
  { id: '3', name: 'Agachamento Livre', category: 'Pernas', equipment: 'Barra', color: 'bg-red-100' },
  { id: '4', name: 'Rosca Direta', category: 'Bíceps', equipment: 'Haltere', color: 'bg-yellow-100' },
  { id: '5', name: 'Prancha', category: 'Core', equipment: 'Chão', color: 'bg-purple-100' },
  { id: '6', name: 'Corrida Esteira', category: 'Cardio', equipment: 'Máquina', color: 'bg-orange-100' },
  { id: '7', name: 'Abdomen Crunch', category: 'Abdominal', equipment: 'Casa', color: 'bg-teal-100' },
  { id: '8', name: 'Tríceps Corda', category: 'Tríceps', equipment: 'Cabo', color: 'bg-indigo-100' },
  { id: '9', name: 'Stiff', category: 'Posterior', equipment: 'Barra', color: 'bg-rose-100' },
  { id: '10', name: 'Panturrilha em Pé', category: 'Pernas', equipment: 'Máquina', color: 'bg-amber-100' },
  { id: '11', name: 'Farmer Walk', category: 'Funcional', equipment: 'Haltere', color: 'bg-cyan-100' },
  { id: '12', name: 'Agachamento Búlgaro', category: 'Pernas', equipment: 'Haltere', color: 'bg-red-100' },
];

function ExerciseListContent({
  onAddExercise,
}: {
  onAddExercise?: (ex: LibraryExercise) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const filteredExercises = MOCK_EXERCISES.filter((ex) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (exercise: typeof MOCK_EXERCISES[number]) => {
    onAddExercise?.({
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
    });
    setJustAdded(exercise.id);
    setTimeout(() => setJustAdded(null), 1200);
  };

  return (
    <>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Exercícios</h2>
          <button className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-gray-900 hover:bg-yellow-500 transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar"
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg border border-gray-200">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        <AnimatePresence mode="popLayout">
          {filteredExercises.map((exercise) => {
            const added = justAdded === exercise.id;
            return (
              <motion.div
                key={exercise.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group flex items-center gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                  added ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleAdd(exercise)}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${exercise.color} flex-shrink-0`}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {exercise.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {exercise.equipment} · {exercise.category}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {added ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center text-white"
                    >
                      <Check size={14} strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <button className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-yellow-400 hover:text-gray-900 transition-all">
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}

export function ExerciseLibrary({
  onAddExercise,
}: {
  onAddExercise?: (ex: LibraryExercise) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar – visible only on xl+ */}
      <div className="w-80 h-screen bg-white border-l border-gray-200 flex-col fixed right-0 top-0 z-20 hidden xl:flex">
        <ExerciseListContent onAddExercise={onAddExercise} />
      </div>

      {/* Mobile FAB – visible below xl */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-yellow-400 text-gray-900 shadow-lg flex items-center justify-center hover:bg-yellow-500 transition-colors xl:hidden"
      >
        <Dumbbell size={24} />
      </button>

      {/* Mobile fullscreen modal */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 bg-white flex flex-col xl:hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Exercícios</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <ExerciseListContent onAddExercise={onAddExercise} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
