import { TextArea } from '@heroui/react';
import { X } from 'lucide-react';
import AttachmentStrip from './AttachmentStrip';
import { ChatInputFileProvider } from './ChatInputFileContext';
import { ChatInputStoreProvider } from './ChatInputStoreProvider';
import DocumentPickerModal from './DocumentPickerModal';
import DropOverlay from './DropOverlay';
import type { ChatInputProps } from './index.type';
import InputToolbar from './InputToolbar';
import OtherSkillModal from './OtherSkillModal';
import styles from './style.module.less';
import { useChatInputController } from './useChatInputController';

function ChatInputContent({
  onSend,
  sending,
  selectedContextText,
  onClearSelectedContext,
}: ChatInputProps) {
  const { attachmentStripProps, containerProps, dropOverlayProps, textAreaProps, toolbarProps } =
    useChatInputController({
      onSend,
      sending,
    });

  return (
    <div className={styles.container} {...containerProps}>
      <div className={styles.inputCard}>
        <DropOverlay {...dropOverlayProps} />

        <AttachmentStrip {...attachmentStripProps} />

        {selectedContextText ? (
          <div className={styles.selectedContext}>
            <span className={styles.selectedContextText}>{selectedContextText}</span>
            <button
              type="button"
              className={styles.selectedContextClear}
              aria-label="移除选中文本上下文"
              onClick={onClearSelectedContext}
            >
              <X size={14} />
            </button>
          </div>
        ) : null}

        <TextArea
          {...textAreaProps}
          placeholder="输入消息..."
          rows={1}
          className={styles.textarea}
        />

        <InputToolbar {...toolbarProps} />
      </div>

      <OtherSkillModal />

      <DocumentPickerModal />

      <div className={styles.footerTip}>AI 内容仅供参考，请仔细甄别</div>
    </div>
  );
}

function ChatInput(props: ChatInputProps) {
  return (
    <ChatInputStoreProvider>
      <ChatInputFileProvider getUploadSessionId={props.getUploadSessionId}>
        <ChatInputContent {...props} />
      </ChatInputFileProvider>
    </ChatInputStoreProvider>
  );
}

export default ChatInput;
