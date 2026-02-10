import { useState } from 'react';
import { Clock, Layers, Repeat, BarChart2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  AerobicWorkout,
  IntensityZone,
} from '../types/aerobic';
import { ZONE_COLORS } from '../types/aerobic';

function ZoneBadge({ zone }: { zone: IntensityZone }) {
  return (
    <span className={`inline-flex items-center rounded-full text-[10px] font-bold text-white px-2 py-0.5 ${ZONE_COLORS[zone]}`}>
      Z{zone}
    </span>
  );
}

function parseDurationToSeconds(dur: string) {
  const parts = dur.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
}

function formatSeconds(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return s > 0 ? `${m}min ${s}s` : `${m}min`;
  return `${s}s`;
}

function formatStepDuration(dur: string, type: string) {
  if (type === 'DISTANCE') return `${dur}m`;
  const parts = dur.split(':');
  if (parts.length === 3) {
    const m = parseInt(parts[1]);
    return `${m}min`;
  }
  return dur;
}

function SummaryContent({ workout }: { workout: AerobicWorkout }) {
  const totalSteps = workout.blocks.reduce((acc, b) => acc + b.steps.length, 0);

  const totalSeconds = workout.blocks.reduce((acc, b) => {
    const blockTime = b.steps.reduce((sa, step) => {
      if (step.durationType === 'TIME') return sa + parseDurationToSeconds(step.duration);
      return sa;
    }, 0);
    return acc + blockTime * b.repetitions;
  }, 0);

  return (
    <>
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
          Resumo do Treino
        </h2>
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Layers size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">{workout.blocks.length}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Blocos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Repeat size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">{totalSteps}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Steps</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock size={16} className="text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-gray-900">{formatSeconds(totalSeconds)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duração</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4" />
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {workout.blocks.map((block, idx) => (
          <div key={block.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-900">
                {idx + 1}. {block.name}
              </span>
              {block.repetitions > 1 && (
                <span className="text-[10px] text-gray-400 font-medium">{block.repetitions}x</span>
              )}
            </div>
            <div className="space-y-1 pl-3 border-l-2 border-gray-100">
              {block.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-2 py-0.5">
                  <ZoneBadge zone={step.intensity} />
                  <span className="text-xs text-gray-500 truncate flex-1">{step.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatStepDuration(step.duration, step.durationType)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function AerobicSummary({ workout }: { workout: AerobicWorkout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar – visible only on xl+ */}
      <div className="w-80 h-screen bg-white border-l border-gray-200 flex-col fixed right-0 top-0 z-20 hidden xl:flex">
        <SummaryContent workout={workout} />
      </div>

      {/* Mobile FAB – visible below xl */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-yellow-400 text-gray-900 shadow-lg flex items-center justify-center hover:bg-yellow-500 transition-colors xl:hidden"
      >
        <BarChart2 size={24} />
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
              <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wide">Resumo do Treino</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex flex-col overflow-hidden">
              <SummaryContent workout={workout} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
