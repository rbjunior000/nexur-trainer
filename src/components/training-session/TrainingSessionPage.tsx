import { AnimatePresence, motion } from 'framer-motion';
import type { StrictExercise } from '../../types/workout';
import { TrainingSessionProvider, useTrainingSession } from './TrainingSessionContext';
import { SessionHeader } from './SessionHeader';
import { ListView } from './ListView';
import { CompactView } from './CompactView';
import { GuidedView } from './GuidedView';
import { PlaybackControls } from './PlaybackControls';
import { TrainingSummaryModal } from './TrainingSummaryModal';

export interface TrainingSessionPageProps {
  sourceExercises: StrictExercise[];
  workoutName?: string;
  onBack: () => void;
}

// ─── Inner (consumes context) ──────────────────────────────────────────────────

function TrainingSessionInner({ onBack }: { onBack: () => void }) {
  const { viewMode, showSummary, closeSummary, currentStep } = useTrainingSession();

  const handleClose = () => {
    if (showSummary) closeSummary();
    onBack();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center">
      <div className="w-full max-w-lg flex flex-col min-h-screen">
        <SessionHeader onClose={handleClose} />

        {/* View content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {viewMode === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <ListView />
              </motion.div>
            )}
            {viewMode === 'compact' && (
              <motion.div
                key="compact"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <CompactView />
              </motion.div>
            )}
            {viewMode === 'guided' && (
              <motion.div
                key="guided"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <GuidedView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Playback controls — sticky at bottom */}
        {currentStep && <PlaybackControls />}

        {/* Summary modal */}
        <AnimatePresence>
          {showSummary && <TrainingSummaryModal />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Page (owns Provider) ──────────────────────────────────────────────────────

/**
 * Top-level strict training execution page.
 * Wraps everything in <TrainingSessionProvider>.
 */
export function TrainingSessionPage({
  sourceExercises,
  workoutName,
  onBack,
}: TrainingSessionPageProps) {
  return (
    <TrainingSessionProvider sourceExercises={sourceExercises} workoutName={workoutName}>
      <TrainingSessionInner onBack={onBack} />
    </TrainingSessionProvider>
  );
}
