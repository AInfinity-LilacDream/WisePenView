import ProviderLogo from '@/components/Icons/ProviderLogo';
import { Popover } from '@/components/Overlay';
import type { ChatModel } from '@/domains/Chat';
import { ListBox, ListBoxItem } from '@heroui/react';
import { Check, ChevronDown, LoaderCircle } from 'lucide-react';
import styles from './style.module.less';

interface ModelSelectorProps {
  models: ChatModel[];
  selectedId?: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (model: ChatModel) => void;
  loading?: boolean;
  disabled?: boolean;
  placement?: 'top' | 'bottom';
}

const renderProviderText = (model: ChatModel): string => {
  if (model.providerName && model.providerModelName) {
    return `${model.providerName} · ${model.providerModelName}`;
  }
  return model.providerModelName || model.providerName || model.provider;
};

function ModelSelector({
  models,
  selectedId,
  isOpen,
  onOpenChange,
  onChange,
  loading = false,
  disabled = false,
  placement = 'bottom',
}: ModelSelectorProps) {
  const selected = models.find((model) => model.id === selectedId) ?? null;

  return (
    <Popover isOpen={isOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger>
        <button type="button" className={styles.trigger} aria-label="选择模型" disabled={disabled}>
          {loading ? (
            <LoaderCircle size={16} className={styles.spinIcon} />
          ) : (
            <ProviderLogo provider={selected?.provider ?? 'openai'} size={16} />
          )}
          <span>{loading ? '模型加载中' : (selected?.name ?? '选择模型')}</span>
          <ChevronDown size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Content className={styles.popover} placement={placement}>
        <Popover.Dialog>
          <div className={styles.menu}>
            <div className={styles.title}>模型</div>
            {models.length === 0 ? (
              <div className={styles.empty}>暂无可用模型</div>
            ) : (
              <ListBox
                aria-label="选择模型"
                selectionMode="single"
                selectedKeys={selected ? [selected.id] : []}
                className={styles.list}
              >
                {models.map((model) => (
                  <ListBoxItem
                    key={model.id}
                    id={model.id}
                    textValue={model.name}
                    onPress={() => onChange(model)}
                  >
                    <span className={styles.item}>
                      <ProviderLogo provider={model.provider} size={18} />
                      <span className={styles.info}>
                        <span className={styles.name}>{model.name}</span>
                        <span className={styles.meta}>{renderProviderText(model)}</span>
                      </span>
                      {selected?.id === model.id ? <Check size={14} /> : null}
                    </span>
                  </ListBoxItem>
                ))}
              </ListBox>
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

export default ModelSelector;
