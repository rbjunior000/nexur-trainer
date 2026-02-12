import { useRef, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { WorkoutEditor } from './components/WorkoutEditor';
import { AerobicEditor } from './components/AerobicEditor';
import { AerobicSummary } from './components/AerobicSummary';
import { StrictTrainingPage } from './components/StrictTrainingPage';
import { AerobicExecutionPage } from './components/AerobicExecutionPage';
import { DEFAULT_BLOCKS } from './types/aerobic';
import type { AerobicWorkout } from './types/aerobic';
import type { StrictExercise } from './types/workout';

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

  // Autoplay add function ref (reuses strict interface with duration)
  const autoplayAddFnRef = useRef<((ex: LibraryExercise) => void) | null>(null);

  // Shared aerobic workout state
  const [aerobicWorkout, setAerobicWorkout] = useState<AerobicWorkout>({
    workoutName: 'Novo Treino Aerobico',
    workoutStartDate: '',
    workoutEndDate: '',
    workoutDescription: '',
    sport: 'running',
    blocks: DEFAULT_BLOCKS,
  });

  // --- Execution state ---
  const [strictExecuting, setStrictExecuting] = useState(false);
  const [strictExercises, setStrictExercises] = useState<StrictExercise[]>([]);
  const [autoplayExecuting, setAutoplayExecuting] = useState(false);
  const [autoplayExercises, setAutoplayExercises] = useState<StrictExercise[]>([]);
  const [aerobicExecuting, setAerobicExecuting] = useState(false);
  const isAnyExecuting = strictExecuting || autoplayExecuting || aerobicExecuting;

  // --- Execution handlers ---
  const handleStartStrict = (exercises: StrictExercise[]) => {
    setStrictExercises(exercises);
    setStrictExecuting(true);
  };

  const handleStartAutoplay = (exercises: StrictExercise[]) => {
    setAutoplayExercises(exercises);
    setAutoplayExecuting(true);
  };

  const handleStartAerobic = () => {
    setAerobicExecuting(true);
  };

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      {/* Sidebar: hidden on mobile during execution */}
      {!isAnyExecuting && (
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      {isAnyExecuting && (
        <div className="hidden md:block">
          <Sidebar mobileOpen={false} onClose={() => {}} />
        </div>
      )}

      {/* Mobile hamburger button - hidden during execution */}
      {!isAnyExecuting && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600 md:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Main content */}
      {isAnyExecuting ? (
        <main className="flex-1 min-w-0 ml-0 md:ml-16 transition-all duration-300">
          {strictExecuting && (
            <StrictTrainingPage
              sourceExercises={strictExercises}
              onBack={() => setStrictExecuting(false)}
            />
          )}
          {autoplayExecuting && (
            <StrictTrainingPage
              sourceExercises={autoplayExercises}
              onBack={() => setAutoplayExecuting(false)}
            />
          )}
          {aerobicExecuting && (
            <AerobicExecutionPage
              workout={aerobicWorkout}
              onBack={() => setAerobicExecuting(false)}
              onFinish={() => setAerobicExecuting(false)}
            />
          )}
        </main>
      ) : (
        <>
          <main className="flex-1 min-w-0 ml-0 md:ml-16 mr-0 xl:mr-80 transition-all duration-300">
            {page === 'strict' && (
              <WorkoutEditor
                onRegisterAdd={(fn) => {
                  addExerciseFnRef.current = fn;
                }}
                onStartTraining={handleStartStrict}
              />
            )}
            {page === 'aerobico' && (
              <AerobicEditor
                workout={aerobicWorkout}
                setWorkout={setAerobicWorkout}
                onStartTraining={handleStartAerobic}
              />
            )}
            {page === 'autoplay' && (
              <WorkoutEditor
                onRegisterAdd={(fn) => {
                  autoplayAddFnRef.current = fn;
                }}
                onStartTraining={handleStartAutoplay}
                defaultExerciseType="duration"
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
            <ExerciseLibrary
              onAddExercise={(ex) => autoplayAddFnRef.current?.(ex)}
            />
          )}
          {page === 'aerobico' && <AerobicSummary workout={aerobicWorkout} />}
        </>
      )}
    </div>
  );
}
