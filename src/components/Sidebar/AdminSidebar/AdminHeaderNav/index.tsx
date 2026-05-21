import { ADMIN_PAGE_CONFIGS } from '@/views/admin/pages';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import {
  RiFileList3Line,
  RiGroupLine,
  RiLockPasswordLine,
  RiMegaphoneLine,
  RiSettings3Line,
  RiShieldKeyholeLine,
  RiStackLine,
  RiTaskLine,
  RiUserSettingsLine,
} from 'react-icons/ri';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../../AppSidebar/AppHeaderNav/style.module.less';
import type { AdminHeaderNavProps } from './index.type';

const { users, resources, groups, announcements, statistics, permissions, settings, logs, tasks } =
  ADMIN_PAGE_CONFIGS;

function AdminHeaderNav({ collapsed }: AdminHeaderNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKeys = [location.pathname];

  const menuItems: MenuProps['items'] = [
    {
      key: users.path,
      icon: <RiUserSettingsLine size={18} />,
      onClick: () => navigate(users.path),
      label: users.title,
    },
    {
      key: resources.path,
      icon: <RiFileList3Line size={18} />,
      onClick: () => navigate(resources.path),
      label: resources.title,
    },
    {
      key: groups.path,
      icon: <RiGroupLine size={18} />,
      onClick: () => navigate(groups.path),
      label: groups.title,
    },
    {
      key: announcements.path,
      icon: <RiMegaphoneLine size={18} />,
      onClick: () => navigate(announcements.path),
      label: announcements.title,
    },
    {
      key: statistics.path,
      icon: <RiStackLine size={18} />,
      onClick: () => navigate(statistics.path),
      label: statistics.title,
    },
    {
      type: 'divider',
    },
    {
      key: permissions.path,
      icon: <RiShieldKeyholeLine size={18} />,
      onClick: () => navigate(permissions.path),
      label: permissions.title,
    },
    {
      key: settings.path,
      icon: <RiSettings3Line size={18} />,
      onClick: () => navigate(settings.path),
      label: settings.title,
    },
    {
      key: logs.path,
      icon: <RiLockPasswordLine size={18} />,
      onClick: () => navigate(logs.path),
      label: logs.title,
    },
    {
      key: tasks.path,
      icon: <RiTaskLine size={18} />,
      onClick: () => navigate(tasks.path),
      label: tasks.title,
    },
  ];

  return (
    <Menu
      mode="inline"
      theme="light"
      className={styles.headerMenu}
      selectedKeys={selectedKeys}
      inlineCollapsed={collapsed}
      items={menuItems}
    />
  );
}

export default AdminHeaderNav;
