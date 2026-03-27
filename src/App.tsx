import { useRef, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ExerciseLibrary } from './components/ExerciseLibrary';
import { AerobicSummary } from './components/AerobicSummary';
import { WorkoutBuilderPage } from './components/workout-builder/WorkoutBuilderPage';
import { TrainingSessionPage } from './components/training-session/TrainingSessionPage';
import { AerobicBuilderPage } from './components/aerobic-builder/AerobicBuilderPage';
import { AerobicSessionPage } from './components/aerobic-session/AerobicSessionPage';
import { Dialog, DialogContent } from './components/ui/dialog';
import type { AerobicWorkout } from './types/aerobic';
import type { StrictExercise } from './types/workout';
import type { Media } from './types/media';

export type LibraryExercise = {
  name: string;
  category: string;
  equipment: string;
  media1: Media | null;
  media2: Media | null;
  orientacoes?: string;
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

  // Refs for "add exercise from library" functions
  const addExerciseFnRef = useRef<((ex: LibraryExercise) => void) | null>(null);
  const autoplayAddFnRef = useRef<((ex: LibraryExercise) => void) | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live exercise lists (for ExerciseLibrary sidebar)
  const [strictCurrentExercises, setStrictCurrentExercises] = useState<StrictExercise[]>([]);
  const [autoplayCurrentExercises, setAutoplayCurrentExercises] = useState<StrictExercise[]>([]);

  // Aerobic workout (kept in App for summary sidebar + execution handoff)
  const [aerobicWorkout, setAerobicWorkout] = useState<AerobicWorkout | null>(null);

  // Execution state
  const [strictExecuting, setStrictExecuting] = useState(false);
  const [strictExercises, setStrictExercises] = useState<StrictExercise[]>([]);
  const [autoplayExecuting, setAutoplayExecuting] = useState(false);
  const [autoplayExercises, setAutoplayExercises] = useState<StrictExercise[]>([]);
  const [aerobicExecuting, setAerobicExecuting] = useState(false);

  return (
    <div className="min-h-screen bg-white flex overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
        className="fixed top-4 left-4 z-30 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm text-gray-600 md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Main content */}
      <main className="flex-1 min-w-0 ml-0 md:ml-16 mr-0 xl:mr-80 transition-all duration-300">
        {page === 'strict' && (
          <WorkoutBuilderPage
            storageKey="nexur-strict-exercises"
            onRegisterAdd={(fn) => { addExerciseFnRef.current = fn; }}
            onStartTraining={(exercises) => {
              setStrictExercises(exercises);
              setStrictExecuting(true);
            }}
            onExercisesChange={setStrictCurrentExercises}
          />
        )}
        {page === 'autoplay' && (
          <WorkoutBuilderPage
            storageKey="nexur-autoplay-exercises"
            lockType="duration"
            onRegisterAdd={(fn) => { autoplayAddFnRef.current = fn; }}
            onStartTraining={(exercises) => {
              setAutoplayExercises(exercises);
              setAutoplayExecuting(true);
            }}
            onExercisesChange={setAutoplayCurrentExercises}
          />
        )}
        {page === 'aerobico' && (
          <AerobicBuilderPage
            onStartTraining={() => setAerobicExecuting(true)}
            onWorkoutChange={setAerobicWorkout}
          />
        )}
      </main>

      {/* Right sidebar */}
      {page === 'strict' && (
        <ExerciseLibrary
          onAddExercise={(ex) => addExerciseFnRef.current?.(ex)}
          workoutExercises={strictCurrentExercises}
        />
      )}
      {page === 'autoplay' && (
        <ExerciseLibrary
          onAddExercise={(ex) => autoplayAddFnRef.current?.(ex)}
          workoutExercises={autoplayCurrentExercises}
        />
      )}
      {page === 'aerobico' && aerobicWorkout && (
        <AerobicSummary workout={aerobicWorkout} />
      )}

      {/* Training session modals */}
      <Dialog open={strictExecuting} onOpenChange={(open) => !open && setStrictExecuting(false)}>
        <DialogContent
          className="inset-0 top-0 left-0 w-full h-full max-w-none rounded-none p-0 translate-x-0 translate-y-0 bg-transparent overflow-auto"
          showClose={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <TrainingSessionPage
            sourceExercises={strictExercises}
            workoutName="Treino Strict"
            onBack={() => setStrictExecuting(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={autoplayExecuting} onOpenChange={(open) => !open && setAutoplayExecuting(false)}>
        <DialogContent
          className="inset-0 top-0 left-0 w-full h-full max-w-none rounded-none p-0 translate-x-0 translate-y-0 bg-transparent overflow-auto"
          showClose={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <TrainingSessionPage
            sourceExercises={autoplayExercises}
            workoutName="Treino Autoplay"
            onBack={() => setAutoplayExecuting(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={aerobicExecuting} onOpenChange={(open) => !open && setAerobicExecuting(false)}>
        <DialogContent
          className="inset-0 top-0 left-0 w-full h-full max-w-none rounded-none p-0 translate-x-0 translate-y-0 bg-transparent overflow-auto"
          showClose={false}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          {aerobicWorkout && (
            <AerobicSessionPage
              workout={aerobicWorkout}
              onBack={() => setAerobicExecuting(false)}
              onFinish={() => setAerobicExecuting(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
