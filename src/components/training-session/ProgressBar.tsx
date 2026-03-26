import { motion } from 'framer-motion';

export interface ProgressBarProps {
  /** 0–1 progress value. */
  progress: number;
  className?: string;
}

/** Animated horizontal progress bar (yellow). */
export function ProgressBar({ progress, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className={`w-full h-1 bg-gray-800 rounded-full overflow-hidden ${className ?? ''}`}>
      <motion.div
        className="h-full bg-yellow-400 rounded-full"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}
