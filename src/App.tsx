import { useRef, useState, useEffect } from 'react';
import { Menu, Dumbbell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { ExerciseLibrary, ExerciseListContent } from './components/ExerciseLibrary';
import { WorkoutEditor } from './components/WorkoutEditor';
import { AerobicEditor } from './components/AerobicEditor';
import { AerobicSummary } from './components/AerobicSummary';
import { AutoplayEditor } from './components/AutoplayEditor';
import { AutoplaySummaryContent } from './components/AutoplaySummary';
import { DEFAULT_BLOCKS } from './types/aerobic';
import type { AerobicWorkout } from './types/aerobic';
import type { AutoplayItem } from './types/autoplay';

export type LibraryExercise = {
  name: string;
  category: string;
  equipment: string;
};

type Page = 'strict' | 'aerobico' | 'autoplay';

function useHashRoute(): [Page, (p: Page) => void] {
  const getPage = (): Page => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    if (hash === 'aerobico') return 'aerobico';
    if (hash === 'autoplay') return 'autoplay';
    return 'strict';
  };

  const [page, setPageState] = useState<Page>(getPage);

  useEffect(() => {
    const handler = () => setPageState(getPage());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const setPage = (p: Page) => {
    window.location.hash = `#/${p}`;
  };

  return [page, setPage];
}

export function App() {
  const [page] = useHashRoute();
  const addExerciseFnRef = useRef<((ex: LibraryExercise) => void) | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Autoplay items state (so summary sidebar can read it)
  const [autoplayItems, setAutoplayItems] = useState<AutoplayItem[]>([]);
  const [autoplaySidebarTab, setAutoplaySidebarTab] = useState<'summary' | 'library'>('summary');
  const [autoplayMobileLibOpen, setAutoplayMobileLibOpen] = useState(false);

  // Shared aerobic workout state (so summary sidebar can read it)
  const [aerobicWorkout, setAerobicWorkout] = useState<AerobicWorkout>({
    workoutName: 'Novo Treino Aeróbico',
    workoutStartDate: '',
    workoutEndDate: '',
    workoutDescription: '',
    sport: 'running',
    blocks: DEFAULT_BLOCKS,
  });

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile hamburger button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600 md:hidden"
      >
        <Menu size={20} />
      </button>

      <main className="flex-1 min-w-0 ml-0 md:ml-16 mr-0 xl:mr-80 transition-all duration-300">
        {page === 'strict' && (
          <WorkoutEditor
            onRegisterAdd={(fn) => {
              addExerciseFnRef.current = fn;
            }}
          />
        )}
        {page === 'aerobico' && (
          <AerobicEditor workout={aerobicWorkout} setWorkout={setAerobicWorkout} />
        )}
        {page === 'autoplay' && (
          <AutoplayEditor
            items={autoplayItems}
            setItems={setAutoplayItems}
            onRegisterAdd={(fn) => {
              addExerciseFnRef.current = fn;
            }}
          />
        )}
      </main>

      {/* Right sidebar changes per page */}
      {page === 'strict' && (
        <ExerciseLibrary
          onAddExercise={(ex) => addExerciseFnRef.current?.(ex)}
        />
      )}
      {page === 'autoplay' && (
        <>
          {/* Desktop: tabbed sidebar with Summary + Library */}
          <div className="w-80 h-screen bg-white border-l border-gray-200 flex-col fixed right-0 top-0 z-20 hidden xl:flex">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setAutoplaySidebarTab('summary')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                  autoplaySidebarTab === 'summary'
                    ? 'text-yellow-600 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Resumo
              </button>
              <button
                onClick={() => setAutoplaySidebarTab('library')}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors ${
                  autoplaySidebarTab === 'library'
                    ? 'text-yellow-600 border-b-2 border-yellow-400'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Biblioteca
              </button>
            </div>
            {autoplaySidebarTab === 'summary' ? (
              <AutoplaySummaryContent items={autoplayItems} />
            ) : (
              <ExerciseListContent onAddExercise={(ex) => addExerciseFnRef.current?.(ex)} />
            )}
          </div>

          {/* Mobile FAB for library */}
          <button
            onClick={() => setAutoplayMobileLibOpen(true)}
            className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-yellow-400 text-gray-900 shadow-lg flex items-center justify-center hover:bg-yellow-500 transition-colors xl:hidden"
          >
            <Dumbbell size={24} />
          </button>

          {/* Mobile fullscreen library modal */}
          <AnimatePresence>
            {autoplayMobileLibOpen && (
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
                    onClick={() => setAutoplayMobileLibOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <ExerciseListContent onAddExercise={(ex) => addExerciseFnRef.current?.(ex)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {page === 'aerobico' && <AerobicSummary workout={aerobicWorkout} />}
    </div>
  );
}
