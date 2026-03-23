import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Check, Dumbbell, X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LibraryExercise } from '../App';
import type { Media } from '../types/media';
import type { StrictExercise } from '../types/workout';
import { MediaPreview } from './MediaPreview';
import { fetchExercises } from '../services/nexurApi';
import { WorkoutSummary } from './WorkoutSummary';

type ApiExercise = LibraryExercise & { id: string };

function thumbnailMedia(media1: Media | null, media2: Media | null): Media | null {
  return media1 ?? media2;
}

function useExercises() {
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchExercises()
      .then((data) => {
        if (!cancelled) setExercises(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { exercises, loading, error };
}

export function ExerciseListContent({
  onAddExercise,
}: {
  onAddExercise?: (ex: LibraryExercise) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const { exercises, loading, error } = useExercises();

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.equipment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = (exercise: ApiExercise) => {
    onAddExercise?.({
      name: exercise.name,
      category: exercise.category,
      equipment: exercise.equipment,
      media1: exercise.media1,
      media2: exercise.media2,
      orientacoes: exercise.orientacoes,
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
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={28} className="animate-spin" />
            <span className="text-sm">Carregando exercícios…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-red-500 px-4">
            <AlertCircle size={28} />
            <span className="text-sm text-center">{error}</span>
          </div>
        )}

        {!loading && !error && (
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
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {thumbnailMedia(exercise.media1, exercise.media2)
                      ? <MediaPreview media={thumbnailMedia(exercise.media1, exercise.media2)} alt={exercise.name} />
                      : <Dumbbell size={16} className="text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {exercise.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {[exercise.equipment, exercise.category].filter(Boolean).join(' · ')}
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

            {filteredExercises.length === 0 && searchTerm && (
              <p className="text-center text-sm text-gray-400 py-10">
                Nenhum exercício encontrado para "{searchTerm}"
              </p>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

function SidebarTabs({
  onAddExercise,
  workoutExercises,
}: {
  onAddExercise?: (ex: LibraryExercise) => void;
  workoutExercises?: StrictExercise[];
}) {
  const [tab, setTab] = useState<'library' | 'summary'>('library');

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setTab('library')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
            tab === 'library'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Exercícios
        </button>
        <button
          onClick={() => setTab('summary')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
            tab === 'summary'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Resumo
        </button>
      </div>

      {tab === 'library' ? (
        <ExerciseListContent onAddExercise={onAddExercise} />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <WorkoutSummary exercises={workoutExercises ?? []} />
        </div>
      )}
    </div>
  );
}

export function ExerciseLibrary({
  onAddExercise,
  workoutExercises,
}: {
  onAddExercise?: (ex: LibraryExercise) => void;
  workoutExercises?: StrictExercise[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar – visible only on xl+ */}
      <div className="w-80 h-screen bg-white border-l border-gray-200 flex-col fixed right-0 top-0 z-20 hidden xl:flex">
        <SidebarTabs onAddExercise={onAddExercise} workoutExercises={workoutExercises} />
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
              <SidebarTabs onAddExercise={onAddExercise} workoutExercises={workoutExercises} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
