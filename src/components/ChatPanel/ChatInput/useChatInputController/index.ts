import { parseErrorMessage } from '@/utils/error';
import { toast } from '@heroui/react';
import {
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  selectChatInputCompletionState,
  selectChatInputSelectedModel,
  useChatInputStore,
  useChatInputStoreApi,
} from '../ChatInputStore';
import type { ChatInputProps } from '../index.type';
import { useChatInputFiles } from '../useChatInputFiles';

interface UseChatInputControllerOptions {
  onSend: ChatInputProps['onSend'];
  sending: boolean;
  hasSelectedContext: ChatInputProps['hasSelectedContext'];
  selectedContextText: string;
  onClearSelectedContext: ChatInputProps['onClearSelectedContext'];
}

export function useChatInputController({
  onSend,
  sending,
  hasSelectedContext,
  selectedContextText,
  onClearSelectedContext,
}: UseChatInputControllerOptions) {
  const store = useChatInputStoreApi();
  const dragCounterRef = useRef(0);
  const { routeFiles, convertPendingImagesToAttachments, clearPendingImageCache } =
    useChatInputFiles();

  const {
    isComposing,
    isDragOver,
    pendingAttachmentUploads,
    selectedModel,
    value,
  } = useChatInputStore(
    useShallow((state) => ({
      isComposing: state.isComposing,
      isDragOver: state.isDragOver,
      pendingAttachmentUploads: state.pendingAttachmentUploads,
      selectedModel: selectChatInputSelectedModel(state),
      value: state.value,
    }))
  );
  const completionState = useChatInputStore(useShallow(selectChatInputCompletionState));
  const { clearAfterSend, setIsComposing, setIsDragOver, setValue } = store.getState();

  const selectedPreviewChars = Array.from(selectedContextText);
  const selectedPreview =
    selectedPreviewChars.length <= 10
      ? selectedContextText
      : `${selectedPreviewChars.slice(0, 5).join('')}...${selectedPreviewChars.slice(-5).join('')}`;
  const sendDisabled = !value.trim() || sending || !selectedModel;

  async function handleSend(): Promise<void> {
    const text = completionState.value.trim();
    if (!text || sending || !selectedModel) return;
    if (pendingAttachmentUploads.some((upload) => upload.status === 'uploading')) {
      toast.warning('附件仍在上传中，请稍后再发送');
      return;
    }

    try {
      const imageAttachments = await convertPendingImagesToAttachments();
      if (!imageAttachments) return;
      await onSend(text, {
        model: selectedModel,
        activeDocRefs: completionState.activeDocRefs,
        activeAttachments: [...completionState.activeAttachments, ...imageAttachments],
        selectedSkills: completionState.selectedSkills,
        selectedTools: completionState.selectedTools,
      });
      clearAfterSend();
      clearPendingImageCache();
    } catch (err) {
      toast.danger(`发送失败: ${parseErrorMessage(err)}`);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleDragEnter(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      void routeFiles(e.dataTransfer.files);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>): void {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) void routeFiles([file]);
        return;
      }
    }
  }

  return {
    containerProps: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    dropOverlayProps: {
      visible: isDragOver,
    },
    attachmentStripProps: {
      selectedContextText,
      selectedPreview,
      hasSelectedContext,
      onClearSelectedContext,
    },
    textAreaProps: {
      value,
      onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value),
      onKeyDown: handleKeyDown,
      onCompositionStart: () => setIsComposing(true),
      onCompositionEnd: () => setIsComposing(false),
      onPaste: handlePaste,
    },
    toolbarProps: {
      sendDisabled,
      onSend: () => void handleSend(),
    },
  };
}
