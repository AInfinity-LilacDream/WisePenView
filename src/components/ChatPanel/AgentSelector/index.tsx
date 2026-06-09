import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import { ChevronDown } from 'lucide-react';
import { useMemo } from 'react';
import popupStyles from '../popupSurface.module.less';
import styles from '../style.module.less';
import type { AgentSelectorProps } from './index.type';

function AgentSelector({ selectedAgent, options, onChange, compact = false }: AgentSelectorProps) {
  const items = useMemo<Required<MenuProps>['items']>(
    () =>
      options.map((option) => ({
        key: option.agentId,
        label: (
          <span className={styles.agentMenuItemLabel}>
            <span>{option.label}</span>
            {option.agentType === 'GROUP' && option.groupName ? (
              <span className={styles.agentMenuItemMeta}>{option.groupName}提供</span>
            ) : null}
          </span>
        ),
      })),
    [options]
  );

  return (
    <Dropdown
      trigger={['hover']}
      menu={{
        items,
        selectable: true,
        selectedKeys: [selectedAgent.agentId],
        onClick: ({ key }) => {
          const target = options.find((option) => option.agentId === key);
          if (!target) return;
          onChange(target);
        },
      }}
      placement="bottomRight"
      overlayClassName={popupStyles.dropdownOverlay}
    >
      <button
        type="button"
        className={`${styles.agentSelectorButton} ${compact ? styles.compactAgentSelectorButton : ''}`}
      >
        <span className={styles.agentSelectorValue}>{selectedAgent.label}</span>
        <ChevronDown className={styles.agentSelectorArrow} size={14} />
      </button>
    </Dropdown>
  );
}

export default AgentSelector;
