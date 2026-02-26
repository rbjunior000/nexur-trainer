export enum MediaType {
  GIF = 'gif',
  IMAGE = 'image',
  STREAM = 'stream',
  LINK = 'link',
  VIDEO = 'video',
  FILE = 'file',
}

export enum MediaStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

export enum MediaOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
  SQUARE = 'square',
}

export interface Media {
  url: string;
  thumbnail?: string;
  type: MediaType;
  asGif?: boolean;
  status: MediaStatus;
  rev?: number;
}

/** Returns the best URL for displaying a media item as an image/thumbnail in the UI */
export function getMediaPreviewUrl(media: Media | null | undefined): string | undefined {
  if (!media || media.status === MediaStatus.ERROR) return undefined;
  if (media.type === MediaType.VIDEO || media.type === MediaType.STREAM) {
    return media.thumbnail ?? media.url;
  }
  return media.url;
}
