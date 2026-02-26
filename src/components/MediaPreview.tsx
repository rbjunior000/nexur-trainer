import { MediaType, MediaStatus } from '../types/media';
import type { Media } from '../types/media';

interface MediaPreviewProps {
  media: Media | null | undefined;
  alt?: string;
  className?: string;
}

export function MediaPreview({ media, alt = '', className = 'w-full h-full object-cover' }: MediaPreviewProps) {
  if (!media || media.status === MediaStatus.ERROR) return null;

  if (media.type === MediaType.VIDEO || media.type === MediaType.STREAM) {
    // If there's a thumbnail image, show it; otherwise stream the video
    if (media.thumbnail) {
      return <img src={media.thumbnail} alt={alt} className={className} />;
    }
    return (
      <video
        src={media.url}
        className={className}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return <img src={media.url} alt={alt} className={className} />;
}
