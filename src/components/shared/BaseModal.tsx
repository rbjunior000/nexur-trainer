import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface BaseModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Extra classes on the inner panel. */
  className?: string;
  /** Bottom sheet style (slides up from bottom). */
  sheet?: boolean;
}

/**
 * Reusable modal container.
 * - Default: centered card with backdrop
 * - `sheet`: bottom sheet (slides up from bottom)
 */
export function BaseModal({ open, onClose, title, children, className, sheet }: BaseModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={sheet ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            animate={sheet ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={sheet ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
            transition={sheet ? { type: 'spring', damping: 30, stiffness: 300 } : undefined}
            className={
              sheet
                ? `w-full bg-white rounded-t-2xl overflow-hidden ${className ?? ''}`
                : `bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden m-4 ${className ?? ''}`
            }
            style={sheet ? { maxHeight: '92dvh' } : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            {sheet && (
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
            )}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
