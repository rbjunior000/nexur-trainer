import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { IntensityZone } from '../../types/aerobic';
import { INTENSITY_LABELS } from '../../types/aerobic';
import { ZoneBadge } from './ZoneBadge';
import { AnimatePresence, motion } from 'framer-motion';

const ALL_ZONES: IntensityZone[] = ['1', '2', '3', '4', '5', '5a', '5b', '5c'];

export interface IntensityZoneDropdownProps {
  value: IntensityZone;
  onChange: (zone: IntensityZone) => void;
}

/**
 * Dropdown for selecting an intensity zone with zone badge previews.
 */
export function IntensityZoneDropdown({ value, onChange }: IntensityZoneDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-yellow-400 transition-colors"
      >
        <ZoneBadge zone={value} />
        <span className="flex-1 text-left text-gray-700">{INTENSITY_LABELS[value]}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden"
            >
              {ALL_ZONES.map((zone) => (
                <button
                  key={zone}
                  type="button"
                  onClick={() => { onChange(zone); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <ZoneBadge zone={zone} />
                  <span className="flex-1 text-sm text-gray-700 text-left">
                    {INTENSITY_LABELS[zone]}
                  </span>
                  {value === zone && <Check size={14} className="text-yellow-500" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
