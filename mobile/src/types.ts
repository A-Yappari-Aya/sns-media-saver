export type MediaType = "video" | "image" | "audio" | "unknown";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  downloadUrl?: string;
  thumbnail?: string;
  title?: string;
  width?: number;
  height?: number;
  duration?: number;
  ext?: string;
  filesize?: number;
  format?: string;
}

export interface ResolveSuccess {
  ok: true;
  platform: string;
  title?: string;
  author?: string;
  sourceUrl: string;
  items: MediaItem[];
}

export interface ResolveError {
  ok: false;
  error: string;
  code: string;
}

export type ResolveResponse = ResolveSuccess | ResolveError;
