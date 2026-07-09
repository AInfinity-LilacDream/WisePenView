import { useBlockNoteEditor } from '@blocknote/react';
import { ButtonGroup, Toolbar } from '@heroui/react';
import { MessageSquarePlus, Sparkles } from 'lucide-react';

import { shouldHideFormattingToolbarForMathBlock } from '@/components/Note/CustomBlockNote/comments/core/isCommentableSelection';
import { useNoteEditorReadOnlyContext } from '@/components/Note/CustomBlockNote/editorReadOnly';
import { BlockTypeMenu } from './components/BlockTypeMenu';
import { ColorMenu } from './components/ColorMenu';
import { FileCaptionToolbarButton } from './components/FileButtons';
import { CreateLinkToolbarButton } from './components/LinkButton';
import { NestButtons } from './components/NestButtons';
import { TextAlignButtons } from './components/TextAlignButtons';
import { TextStyleButtons } from './components/TextStyleButtons';
import { ToolbarButton } from './components/ToolbarButton';
import type { NoteToolbarProps } from './index.type';
import styles from './style.module.less';
import { useFloatingToolbarState } from './useFloatingToolbarState';
import { stopToolbarMouseDown } from './utils';

function NoteToolbar({
  onAskAi,
  showAddComment = false,
  onRememberPendingCommentReference,
}: NoteToolbarProps) {
  const readOnly = useNoteEditorReadOnlyContext();
  const editor = useBlockNoteEditor();
  const toolbarState = useFloatingToolbarState(editor);
  const commentsExtension = editor.getExtension('comments') as
    | { startPendingComment?: () => void }
    | undefined;

  if (!toolbarState.visible || shouldHideFormattingToolbarForMathBlock(editor)) {
    return null;
  }

  return (
    <div
      className={styles.toolbarPopover}
      style={{
        left: toolbarState.left,
        top: toolbarState.top,
      }}
    >
      <Toolbar
        aria-label="格式工具栏"
        isAttached
        className={styles.toolbar}
        onMouseDown={stopToolbarMouseDown}
      >
        {!readOnly ? (
          <>
            <ButtonGroup size="sm" variant="ghost" aria-label="块类型和文件">
              <BlockTypeMenu />
              <FileCaptionToolbarButton />
            </ButtonGroup>
            <TextStyleButtons />
            <TextAlignButtons />
            <ColorMenu />
            <NestButtons />
            <CreateLinkToolbarButton />
          </>
        ) : null}
        <ButtonGroup size="sm" variant="ghost" aria-label="批注和 AI">
          {showAddComment && commentsExtension?.startPendingComment ? (
            <ToolbarButton
              label="添加批注"
              icon={<MessageSquarePlus size={20} />}
              onMouseDownCapture={onRememberPendingCommentReference}
              onPress={() => commentsExtension.startPendingComment?.()}
            />
          ) : null}
          <ToolbarButton label="问 AI" icon={<Sparkles size={20} />} onPress={onAskAi} />
        </ButtonGroup>
      </Toolbar>
    </div>
  );
}

export default NoteToolbar;
