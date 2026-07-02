import { create } from 'zustand';

export type DriveUploadQueuePhase = 'hashing' | 'uploading' | 'confirming' | 'done' | 'failed';

export interface DriveUploadQueueItem {
  id: string;
  filename: string;
  fileType: string;
  size: number;
  phase: DriveUploadQueuePhase;
  progress: number;
  documentId?: string;
  objectKey?: string;
  errorMessage?: string;
}

type DriveUploadQueuePatch = Partial<Omit<DriveUploadQueueItem, 'id'>>;

interface DriveUploadQueueState {
  uploads: DriveUploadQueueItem[];
  startUploads: (uploads: DriveUploadQueueItem[]) => void;
  updateUpload: (id: string, patch: DriveUploadQueuePatch) => void;
  removeUpload: (id: string) => void;
  clearUploads: () => void;
}

const initialState = {
  uploads: [] as DriveUploadQueueItem[],
};

export const useDriveUploadQueueStore = create<DriveUploadQueueState>()((set) => ({
  ...initialState,

  startUploads: (uploads) =>
    set((state) => ({
      uploads: [
        ...state.uploads,
        ...uploads.map((upload) => ({
          ...upload,
          progress: clampProgress(upload.progress),
        })),
      ],
    })),

  updateUpload: (id, patch) =>
    set((state) => ({
      uploads: state.uploads.map((upload) =>
        upload.id === id ? { ...upload, ...normalizeUploadPatch(patch) } : upload
      ),
    })),

  removeUpload: (id) =>
    set((state) => ({
      uploads: state.uploads.filter((upload) => upload.id !== id),
    })),

  clearUploads: () => set(initialState),
}));

export const clearDriveUploadQueueStore = (): void => {
  useDriveUploadQueueStore.setState(initialState);
};

function normalizeUploadPatch(patch: DriveUploadQueuePatch): DriveUploadQueuePatch {
  if (patch.progress == null) {
    return patch;
  }
  return {
    ...patch,
    progress: clampProgress(patch.progress),
  };
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}
