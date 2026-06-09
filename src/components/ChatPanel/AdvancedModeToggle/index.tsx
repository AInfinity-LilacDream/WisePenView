import { useAdvancedModeStore } from '@/store';
import { Switch } from 'antd';
import styles from '../style.module.less';
import type { AdvancedModeToggleProps } from './index.type';

function AdvancedModeToggle({ compact = false }: AdvancedModeToggleProps) {
  const advancedMode = useAdvancedModeStore((state) => state.advancedMode);
  const setAdvancedMode = useAdvancedModeStore((state) => state.setAdvancedMode);

  return (
    <div
      className={`${styles.advancedModeToggle} ${compact ? styles.compactToggle : ''}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('.ant-switch')) {
          setAdvancedMode(!advancedMode);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={advancedMode}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!(e.target as HTMLElement).closest('.ant-switch')) {
            setAdvancedMode(!advancedMode);
          }
        }
      }}
    >
      <span className={styles.advancedModeText}>高级模式</span>
      <Switch size="small" checked={advancedMode} onChange={setAdvancedMode} />
    </div>
  );
}

export default AdvancedModeToggle;
