export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const NOTE_COLLABORATION_WS_URL = import.meta.env.VITE_NOTE_COLLAB_WS_URL;

export const DRAWIO_EMBED_URL =
  import.meta.env.VITE_DRAWIO_EMBED_URL || 'https://embed.diagrams.net/';

export const ONLYOFFICE_DOCUMENT_SERVER_PUBLIC_URL = import.meta.env
  .VITE_ONLYOFFICE_DOCUMENT_SERVER_PUBLIC_URL;

export function buildApiUrl(path: `/${string}`): string {
  return `${API_BASE_URL}${path}`;
}
