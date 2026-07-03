import type { Model } from '@/components/ChatPanel/index.type';
import { useChatService } from '@/domains';
import {
  buildAdvancedSkillTreeGroups,
  buildCapabilityPickerSections,
  getPrimarySkillsForAgent,
  type CapabilityToolOption,
  type SkillScopeTreeGroup,
} from '@/domains/Chat';
import type { SkillSummary } from '@/domains/Resource';
import type { ChatAgentOption } from '@/store';
import { parseErrorMessage } from '@/utils/error';
import { base64ToFile, fileToBase64, generateThumbnail } from '@/utils/file/upload';
import { toast } from '@heroui/react';
import { useRequest, useUpdateEffect } from 'ahooks';
import {
  useMemo,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  DEFAULT_PERSONAL_AGENT,
  selectChatInputCompletionState,
  useChatInputStore,
  useChatInputStoreApi,
} from '../ChatInputStore';
import type { ChatInputProps, LocalAttachmentPayload } from '../index.type';

const MAX_IMAGE_BASE64_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_RAW_BYTES_APPROX = Math.floor(MAX_IMAGE_BASE64_BYTES * 0.75);
const MAX_IMAGE_COUNT = 10;
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);

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
  const chatService = useChatService();
  const store = useChatInputStoreApi();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const base64MapRef = useRef<Map<string, string>>(new Map());
  const dragCounterRef = useRef(0);

  const {
    activeAttachments,
    activeDocRefs,
    attachmentOpen,
    capabilityOpen,
    documentPickerOpen,
    isComposing,
    isDragOver,
    modelOpen,
    otherSkillModalOpen,
    pendingAttachmentUploads,
    pendingImageMetas,
    selectedAgent,
    selectedModelId,
    selectedSkills,
    selectedTools,
    value,
  } = useChatInputStore(
    useShallow((state) => ({
      activeAttachments: state.activeAttachments,
      activeDocRefs: state.activeDocRefs,
      attachmentOpen: state.attachmentOpen,
      capabilityOpen: state.capabilityOpen,
      documentPickerOpen: state.documentPickerOpen,
      isComposing: state.isComposing,
      isDragOver: state.isDragOver,
      modelOpen: state.modelOpen,
      otherSkillModalOpen: state.otherSkillModalOpen,
      pendingAttachmentUploads: state.pendingAttachmentUploads,
      pendingImageMetas: state.pendingImageMetas,
      selectedAgent: state.selectedAgent,
      selectedModelId: state.selectedModelId,
      selectedSkills: state.selectedSkills,
      selectedTools: state.selectedTools,
      value: state.value,
    }))
  );
  const completionState = useChatInputStore(useShallow(selectChatInputCompletionState));
  const {
    addActiveAttachment,
    addDocRefs: addStoredDocRefs,
    addPendingAttachmentUpload,
    addPendingImageMeta,
    clearAfterSend,
    clearCapabilities,
    removeActiveAttachment: removeStoredAttachment,
    removeDocRef: removeStoredDocRef,
    removePendingAttachmentUpload: removeStoredUpload,
    removePendingImageMeta: removeStoredPendingImage,
    removeSkill: removeStoredSkill,
    removeTool: removeStoredTool,
    replaceAgentIfMissing,
    replaceExternalSkills,
    setAttachmentOpen,
    setCapabilityOpen,
    setDocumentPickerOpen,
    setIsComposing,
    setIsDragOver,
    setModelOpen,
    setOtherSkillModalOpen,
    setPendingAttachmentUploadFailed,
    setSelectedAgent,
    setSelectedModelId,
    setValue,
    toggleSkill: toggleStoredSkill,
    toggleTool: toggleStoredTool,
  } = store.getState();

  const { data: workspace, loading: workspaceLoading } = useRequest(
    () => chatService.getWorkspace(),
    { refreshDeps: [] }
  );
  const { data: toolOptionsData } = useRequest(() => chatService.getTools(), { refreshDeps: [] });
  const { data: modelData = [], loading: modelsLoading } = useRequest(
    () => chatService.getModels(),
    { refreshDeps: [] }
  );
  const models: Model[] = modelData;
  const toolOptions: CapabilityToolOption[] = toolOptionsData ?? [];

  const agentOptions = useMemo<ChatAgentOption[]>(
    () => [
      DEFAULT_PERSONAL_AGENT,
      ...(workspace?.personalAgents ?? []),
      ...(workspace?.groupAgents ?? []),
    ],
    [workspace?.groupAgents, workspace?.personalAgents]
  );

  const primarySkills = useMemo(
    () => getPrimarySkillsForAgent(workspace?.skills ?? [], selectedAgent),
    [selectedAgent, workspace?.skills]
  );
  const advancedSkillGroups = useMemo(
    () =>
      buildAdvancedSkillTreeGroups(
        workspace?.skills ?? [],
        workspace?.groups ?? [],
        selectedAgent,
        primarySkills
      ),
    [primarySkills, selectedAgent, workspace?.groups, workspace?.skills]
  );
  const otherSkillGroups = useMemo<SkillScopeTreeGroup[]>(() => {
    const primaryIds = new Set(primarySkills.map((skill) => skill.skillId));
    return advancedSkillGroups
      .map((group) => ({
        ...group,
        skills: group.skills.filter((skill) => !primaryIds.has(skill.skillId)),
      }))
      .filter((group) => group.skills.length > 0);
  }, [advancedSkillGroups, primarySkills]);

  const capabilitySections = buildCapabilityPickerSections({
    primarySkills,
    selectedSkills,
    selectedTools,
    toolOptions,
    advancedMode: true,
    otherSkillGroups,
  });

  const selectedModel = useMemo(() => {
    if (models.length === 0) return null;
    const explicitModel = selectedModelId
      ? models.find((model) => model.id === selectedModelId)
      : undefined;
    return explicitModel ?? models.find((model) => model.isDefault) ?? models[0];
  }, [models, selectedModelId]);
  const currentModelVision = selectedModel?.vision ?? false;
  const selectedPreviewChars = Array.from(selectedContextText);
  const selectedPreview =
    selectedPreviewChars.length <= 10
      ? selectedContextText
      : `${selectedPreviewChars.slice(0, 5).join('')}...${selectedPreviewChars.slice(-5).join('')}`;
  const sendDisabled = !value.trim() || sending || !selectedModel;

  useUpdateEffect(() => {
    const nextAgent =
      agentOptions.find((agent) => agent.agentId === selectedAgent.agentId) ??
      DEFAULT_PERSONAL_AGENT;
    replaceAgentIfMissing(nextAgent);
  }, [agentOptions, selectedAgent.agentId]);

  useUpdateEffect(() => {
    clearCapabilities();
  }, [selectedAgent.agentId]);

  useUpdateEffect(() => {
    const validIds = new Set(pendingImageMetas.map((meta) => meta.id));
    for (const key of base64MapRef.current.keys()) {
      if (!validIds.has(key)) {
        base64MapRef.current.delete(key);
      }
    }
  }, [pendingImageMetas]);

  function removeAttachment(attachmentId: string): void {
    removeStoredAttachment(attachmentId);
  }

  function addDocRefs(resources: Parameters<typeof addStoredDocRefs>[0]): void {
    addStoredDocRefs(resources);
  }

  function removeDocRef(resourceId: string): void {
    removeStoredDocRef(resourceId);
  }

  function removePendingImage(id: string): void {
    removeStoredPendingImage(id);
    base64MapRef.current.delete(id);
  }

  function removeUpload(id: string): void {
    removeStoredUpload(id);
  }

  function toggleSkill(skillId: string): void {
    const skill = primarySkills.find((item) => item.skillId === skillId);
    if (!skill) return;
    toggleStoredSkill(skill, selectedAgent);
  }

  function removeSkill(skillId: string): void {
    removeStoredSkill(skillId);
  }

  function toggleTool(toolId: string): void {
    const tool = toolOptions.find((item) => item.toolId === toolId);
    if (!tool) return;
    toggleStoredTool(tool);
  }

  function removeTool(tool: CapabilityToolOption): void {
    removeStoredTool(tool.toolId);
  }

  function handleOtherSkillConfirm(
    selected: Array<{ skill: SkillSummary; sourceAgent: ChatAgentOption | null }>
  ): void {
    replaceExternalSkills(selected);
  }

  async function uploadAndAddAttachment(file: File): Promise<LocalAttachmentPayload | null> {
    const id = crypto.randomUUID();
    addPendingAttachmentUpload({ id, filename: file.name, status: 'uploading' });
    try {
      const result = await chatService.uploadAttachment({
        file,
        saveToLibrary: false,
      });
      removeStoredUpload(id);
      const attachment: LocalAttachmentPayload = {
        attachmentId: result.attachmentId,
        filename: result.filename ?? file.name,
        enabled: true,
      };
      addActiveAttachment(attachment);
      return attachment;
    } catch (err) {
      setPendingAttachmentUploadFailed(id);
      toast.danger(`附件上传失败: ${parseErrorMessage(err)}`);
      return null;
    }
  }

  async function addPendingVisionImage(file: File): Promise<void> {
    try {
      if (file.size > MAX_IMAGE_RAW_BYTES_APPROX) {
        toast.warning(`${file.name} 过大，图片大小约限制原图 3.75MB`);
        return;
      }
      const { mimeType, base64 } = await fileToBase64(file);
      const id = crypto.randomUUID();
      const thumbnailUrl = await generateThumbnail(file, 48).catch(() => '');
      base64MapRef.current.set(id, base64);
      addPendingImageMeta({ id, filename: file.name, mimeType, thumbnailUrl });
    } catch (err) {
      toast.danger(`图片添加失败: ${parseErrorMessage(err)}`);
    }
  }

  async function convertPendingImagesToAttachments(): Promise<LocalAttachmentPayload[] | null> {
    if (pendingImageMetas.length === 0) return [];
    const attachments: LocalAttachmentPayload[] = [];
    for (const meta of pendingImageMetas) {
      const base64 = base64MapRef.current.get(meta.id);
      if (!base64) {
        toast.danger(`${meta.filename} 图片数据已失效，请重新添加`);
        return null;
      }
      const file = base64ToFile(base64, meta.mimeType, meta.filename);
      const attachment = await uploadAndAddAttachment(file);
      if (!attachment) {
        return null;
      }
      attachments.push(attachment);
      removePendingImage(meta.id);
    }
    return attachments;
  }

  async function routeFiles(fileList: FileList | File[]): Promise<void> {
    const files = Array.from(fileList);
    let acceptedImageCount = pendingImageMetas.length;
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const isImage = IMAGE_EXTENSIONS.has(ext) || file.type.startsWith('image/');
      if (!isImage) {
        await uploadAndAddAttachment(file);
        continue;
      }
      if (!currentModelVision) {
        toast.warning('当前模型不支持图片，已按普通附件上传');
        await uploadAndAddAttachment(file);
        continue;
      }
      if (acceptedImageCount >= MAX_IMAGE_COUNT) {
        toast.warning(`最多 ${MAX_IMAGE_COUNT} 张图片`);
        continue;
      }
      if (file.size > MAX_IMAGE_RAW_BYTES_APPROX) {
        toast.warning(`${file.name} 过大，图片大小约限制原图 3.75MB`);
        continue;
      }
      acceptedImageCount += 1;
      await addPendingVisionImage(file);
    }
  }

  function handleModelChange(model: Model): void {
    const wasVision = currentModelVision;
    setSelectedModelId(model.id);
    setModelOpen(false);
    if (wasVision && !model.vision) {
      void convertPendingImagesToAttachments();
    }
  }

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
      base64MapRef.current.clear();
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

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>): void {
    if (e.target.files && e.target.files.length > 0) {
      void routeFiles(e.target.files);
    }
    e.target.value = '';
  }

  function openUploadPicker(): void {
    fileInputRef.current?.click();
    setAttachmentOpen(false);
  }

  function openDocumentPicker(): void {
    setAttachmentOpen(false);
    setDocumentPickerOpen(true);
  }

  function openOtherSkillModal(): void {
    setCapabilityOpen(false);
    setOtherSkillModalOpen(true);
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
      resources: activeDocRefs,
      attachments: activeAttachments,
      images: pendingImageMetas,
      uploads: pendingAttachmentUploads,
      skills: selectedSkills,
      tools: selectedTools,
      onClearSelectedContext,
      onRemoveResource: removeDocRef,
      onRemoveAttachment: removeAttachment,
      onRemoveImage: removePendingImage,
      onRemoveUpload: removeUpload,
      onRemoveSkill: removeSkill,
      onRemoveTool: removeTool,
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
      attachmentOpen,
      capabilityOpen,
      modelOpen,
      agentOptions,
      selectedAgent,
      selectedModel,
      models,
      modelsLoading,
      selectedSkills,
      selectedTools,
      capabilitySections,
      sendDisabled,
      onAttachmentOpenChange: setAttachmentOpen,
      onCapabilityOpenChange: setCapabilityOpen,
      onModelOpenChange: setModelOpen,
      onLocalAttachPress: openUploadPicker,
      onCloudAttachPress: openDocumentPicker,
      onAgentChange: setSelectedAgent,
      onModelChange: handleModelChange,
      onToggleSkill: toggleSkill,
      onToggleTool: toggleTool,
      onRemoveSkill: removeSkill,
      onSelectOtherSkill: openOtherSkillModal,
      onSend: () => void handleSend(),
    },
    handleFileInputChange,
    otherSkillModalProps: {
      open: otherSkillModalOpen,
      groups: otherSkillGroups,
      currentAgent: selectedAgent,
      selectedSkills,
      onClose: () => setOtherSkillModalOpen(false),
      onConfirm: handleOtherSkillConfirm,
    },
    documentPickerModalProps: {
      open: documentPickerOpen,
      onClose: () => setDocumentPickerOpen(false),
      onConfirm: addDocRefs,
    },
    fileInputRef,
    workspaceLoading,
  };
}
