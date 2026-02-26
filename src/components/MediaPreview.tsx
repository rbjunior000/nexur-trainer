import { Play, Link2 } from 'lucide-react';
import { MediaType, MediaStatus } from '../types/media';
import type { Media } from '../types/media';

interface MediaPreviewProps {
  media: Media | null | undefined;
  alt?: string;
  className?: string;
  /** When true, shows a static preview (thumbnail + play icon) without playing */
  staticPreview?: boolean;
}

// --- YouTube helpers (mirrors Thumbnail/index.tsx normalizeYoutubeUrl) ---
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

function getYoutubeThumbnail(url: string): string | null {
  const id = extractYoutubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

// --- Component ---
export function MediaPreview({
  media,
  alt = '',
  className = 'w-full h-full object-cover',
  staticPreview = false,
}: MediaPreviewProps) {
  if (!media || media.status === MediaStatus.ERROR) return null;

  const isImage = media.type === MediaType.IMAGE || media.type === MediaType.GIF;

  // IMAGE / GIF
  if (isImage) {
    return <img src={media.url} alt={alt} className={className} />;
  }

  // LINK (YouTube, Vimeo, external URLs)
  if (media.type === MediaType.LINK) {
    const ytThumb = getYoutubeThumbnail(media.url);
    if (ytThumb) {
      return <img src={ytThumb} alt={alt} className={className} />;
    }
    // Generic external link placeholder (no video ID extractable)
    return (
      <div className={`flex items-center justify-center bg-gray-800 ${className}`}>
        <Link2 size={20} className="text-gray-500" />
      </div>
    );
  }

  // VIDEO / STREAM
  if (media.type === MediaType.VIDEO || media.type === MediaType.STREAM) {
    if (staticPreview) {
      // Show thumbnail (may be an mp4 preview) + play icon overlay
      const thumbSrc = media.thumbnail ?? media.url;
      const thumbIsVideo = isVideoUrl(thumbSrc);
      return (
        <div className="relative w-full h-full">
          {thumbIsVideo
            ? <video src={thumbSrc} className={className} muted playsInline />
            : <img src={thumbSrc} alt={alt} className={className} />
          }
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
              <Play size={18} fill="white" stroke="none" className="ml-0.5" />
            </div>
          </div>
        </div>
      );
    }

    if (media.thumbnail) {
      if (isVideoUrl(media.thumbnail)) {
        return <video src={media.thumbnail} className={className} autoPlay loop muted playsInline />;
      }
      return <img src={media.thumbnail} alt={alt} className={className} />;
    }
    return <video src={media.url} className={className} autoPlay loop muted playsInline />;
  }

  // FILE or unknown — generic placeholder
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <Link2 size={20} className="text-gray-500" />
    </div>
  );
}
