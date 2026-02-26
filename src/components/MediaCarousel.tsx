import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Media } from '../types/media';
import { MediaPreview } from './MediaPreview';

interface MediaCarouselProps {
  items: (Media | null | undefined)[];
  alt?: string;
}

export function MediaCarousel({ items, alt = '' }: MediaCarouselProps) {
  const medias = items.filter((m): m is Media => m != null);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1); // 1 = forward, -1 = backward
  const touchStartX = useRef<number | null>(null);

  if (medias.length === 0) return null;

  const go = (next: number) => {
    setDir(next > index ? 1 : -1);
    setIndex(next);
  };

  const prev = () => go((index - 1 + medias.length) % medias.length);
  const next = () => go((index + 1) % medias.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
    touchStartX.current = null;
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* One slide at a time — natural dimensions, no crop */}
      <AnimatePresence initial={false} mode="wait" custom={dir}>
        <motion.div
          key={index}
          custom={dir}
          variants={{
            enter: (d: number) => ({ x: d * 40, opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => ({ x: d * -40, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <MediaPreview
            media={medias[index]}
            alt={`${alt} ${index + 1}`}
            className="w-full h-auto block"
          />
        </motion.div>
      </AnimatePresence>

      {/* Controls — only when multiple items */}
      {medias.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white z-10"
          >
            <ChevronRight size={18} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {medias.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
