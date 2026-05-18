import IconText from '@/components/Common/IconText';
import { Button } from 'antd';
import { AiOutlineDelete } from 'react-icons/ai';
import { RiMoneyDollarCircleLine, RiUserLine } from 'react-icons/ri';
import type { MemberListToolbarProps } from './index.type';
import styles from './style.module.less';

function MemberListToolbar({
  isEditMode,
  total,
  groupDisplayConfig,
  selectedCount,
  onModifyPermission,
  onAssignQuota,
  onDelete,
  onToggleEditMode,
  onInviteUser,
}: MemberListToolbarProps) {
  if (isEditMode) {
    return (
      <div className={styles.toolbarEdit}>
        <div className={styles.toolbarEditContent}>
          <div className={styles.toolbarEditContentLeft}>
            {groupDisplayConfig.canModifyPermission && (
              <Button onClick={onModifyPermission} disabled={selectedCount === 0}>
                <IconText icon={<RiUserLine />} iconSize={16}>
                  修改权限
                </IconText>
              </Button>
            )}
            {groupDisplayConfig.canAssignQuota && (
              <Button onClick={onAssignQuota} disabled={selectedCount === 0}>
                <IconText icon={<RiMoneyDollarCircleLine />} iconSize={16}>
                  分配配额
                </IconText>
              </Button>
            )}
            {groupDisplayConfig.canRemoveMember && (
              <Button danger onClick={onDelete} disabled={selectedCount === 0}>
                <IconText icon={<AiOutlineDelete />} iconSize={16}>
                  删除成员
                </IconText>
              </Button>
            )}
          </div>
          <Button onClick={onToggleEditMode}>取消编辑</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.toolbarDefault}>
      <span className={styles.toolbarDefaultText}>共 {total} 人</span>
      <div className={styles.toolbarDefaultButtons}>
        {groupDisplayConfig.canEnterEditMode && (
          <Button onClick={onToggleEditMode}>管理用户</Button>
        )}
        {groupDisplayConfig.canInviteMember && (
          <Button type="primary" onClick={onInviteUser}>
            邀请用户
          </Button>
        )}
      </div>
    </div>
  );
}

export default MemberListToolbar;
