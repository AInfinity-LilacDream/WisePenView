import popupStyles from '@/components/ChatPanel/popupSurface.module.less';
import type { CapabilityPickerItem } from '@/domains/Chat/mapper/capabilityPicker.mapper';
import type { MenuProps } from 'antd';
import { Divider, Empty, Menu } from 'antd';
import { Check, Wrench } from 'lucide-react';
import chatInputStyles from '../style.module.less';
import type { CapabilityPickerProps } from './index.type';
import styles from './style.module.less';

function CapabilityPicker({ open, sections, onItemPress, onMenuInteract }: CapabilityPickerProps) {
  if (!open) return null;

  const hasAnyItems = sections.some((section) => section.items.length > 0);
  if (!hasAnyItems) {
    return (
      <div className={`${styles.panel} ${popupStyles.surface}`}>
        <div className={styles.empty}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用能力" />
        </div>
      </div>
    );
  }

  const handleClick = (item: CapabilityPickerItem) => {
    onMenuInteract?.();
    onItemPress(item);
  };

  const sectionElements: React.ReactNode[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.items.length === 0) continue;

    const menuItems: MenuProps['items'] = section.items.map((item) => ({
      key: item.key,
      icon: item.kind === 'tool' ? <Wrench size={16} /> : undefined,
      label: (
        <span className={`${chatInputStyles.menuItemRow} ${popupStyles.menuLabel}`}>
          <span>
            {item.label}
            {item.sourceText ? (
              <span className={chatInputStyles.capabilitySourceText}>{item.sourceText}</span>
            ) : null}
          </span>
          {item.checked && (
            <span className={chatInputStyles.capabilityCheck}>
              <Check size={16} />
            </span>
          )}
        </span>
      ),
    }));

    if (sectionElements.length > 0) {
      sectionElements.push(<Divider key={`divider-${section.key}`} className={styles.divider} />);
    }

    sectionElements.push(
      <Menu
        key={section.key}
        mode="inline"
        selectedKeys={[]}
        onClick={({ key }) => {
          const item = section.items.find((it) => it.key === key);
          if (item) handleClick(item);
        }}
        items={menuItems}
        className={`${styles.menu} ${popupStyles.menu}`}
      />
    );
  }

  return <div className={`${styles.panel} ${popupStyles.surface}`}>{sectionElements}</div>;
}

export default CapabilityPicker;
