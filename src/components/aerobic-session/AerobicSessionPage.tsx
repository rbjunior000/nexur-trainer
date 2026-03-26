import { AnimatePresence, motion } from 'framer-motion';
import type { AerobicWorkout } from '../../types/aerobic';
import { ZONE_BG } from './zoneColors';
import { AerobicSessionProvider, useAerobicSession } from './AerobicSessionContext';
import { AerobicHeader } from './AerobicHeader';
import { SegmentedProgressBar } from './SegmentedProgressBar';
import { BlockContextInfo } from './BlockContextInfo';
import { ZoneRing } from './ZoneRing';
import { StepTimerDisplay } from './StepTimerDisplay';
import { NextStepPreview } from './NextStepPreview';
import { AerobicPlaybackControls } from './AerobicPlaybackControls';
import { AerobicSummaryModal } from './AerobicSummaryModal';

export interface AerobicSessionPageProps {
  workout: AerobicWorkout;
  onBack: () => void;
  onFinish: () => void;
}

function AerobicSessionInner({ onBack }: { onBack: () => void }) {
  const { currentStep, currentIndex, progress } = useAerobicSession();
  if (!currentStep) return null;

  const zone = currentStep.step.intensity;
  const zoneBg = ZONE_BG[zone];

  return (
    <motion.div className={`min-h-screen flex justify-center transition-colors duration-500 ${zoneBg}`}>
      <div className="w-full max-w-lg flex flex-col min-h-screen">
        <AerobicHeader onBack={onBack} />
        <SegmentedProgressBar />
        <BlockContextInfo />

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center w-full max-w-md gap-6"
            >
              <ZoneRing zone={zone} progress={progress} />
              <StepTimerDisplay />
            </motion.div>
          </AnimatePresence>
        </div>

        <NextStepPreview />
        <AerobicPlaybackControls />
      </div>

      <AnimatePresence>
        <AerobicSummaryModal />
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Top-level aerobic execution page.
 * Wraps everything in <AerobicSessionProvider>.
 */
export function AerobicSessionPage({ workout, onBack, onFinish }: AerobicSessionPageProps) {
  return (
    <AerobicSessionProvider workout={workout} onFinish={onFinish}>
      <AerobicSessionInner onBack={onBack} />
    </AerobicSessionProvider>
  );
}
