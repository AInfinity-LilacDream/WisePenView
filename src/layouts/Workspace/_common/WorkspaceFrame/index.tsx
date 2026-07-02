import clsx from 'clsx';
import type { ReactNode } from 'react';
import styles from './style.module.less';

interface WorkspaceFrameProps {
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

function WorkspaceFrame({ header, children, className, bodyClassName }: WorkspaceFrameProps) {
  return (
    <div className={clsx(styles.root, className)}>
      {header}
      <div className={clsx(styles.body, bodyClassName)}>{children}</div>
    </div>
  );
}

export default WorkspaceFrame;
