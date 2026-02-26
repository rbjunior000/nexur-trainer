import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Media } from '../types/media';
import { MediaType } from '../types/media';
import { MediaPreview } from './MediaPreview';

// --- YouTube helpers ---
function normalizeYoutubeUrl(url: string): string {
  if (url.includes('youtube.com/shorts/')) {
    return url.split('?')[0].replace('shorts/', 'watch?v=');
  }
  if (url.includes('youtube.com/live/')) {
    return url.split('?')[0].replace('live/', 'watch?v=');
  }
  return url;
}

function extractYoutubeId(url: string): string | null {
  const normalized = normalizeYoutubeUrl(url);
  const match = normalized.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

interface MediaCarouselProps {
  items: (Media | null | undefined)[];
  alt?: string;
  /** When true, YouTube links show a play button and open the embed player on click */
  playable?: boolean;
}

export function MediaCarousel({ items, alt = '', playable = false }: MediaCarouselProps) {
  const medias = items.filter((m): m is Media => m != null);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [playing, setPlaying] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Reset player when slide changes
  useEffect(() => { setPlaying(false); }, [index]);

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

  const currentMedia = medias[index];
  const ytId = playable && currentMedia?.type === MediaType.LINK
    ? extractYoutubeId(currentMedia.url)
    : null;

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
          {ytId && playing ? (
            // YouTube embed player
            <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="relative">
              <MediaPreview
                media={currentMedia}
                alt={`${alt} ${index + 1}`}
                className="w-full h-auto block"
              />
              {/* Play button overlay for YouTube when playable */}
              {ytId && !playing && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={() => setPlaying(true)}
                >
                  <div className="w-14 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-lg opacity-90">
                    <Play size={26} fill="white" stroke="none" className="ml-1" />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls — only when multiple items and not playing */}
      {medias.length > 1 && !playing && (
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
