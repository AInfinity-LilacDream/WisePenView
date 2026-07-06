import AppModal from '@/components/AppModal';
import { useGroupService } from '@/domains';
import type { JoinGroupRequest } from '@/domains/Group';
import { parseErrorMessage } from '@/utils/error';
import { InputOTP, REGEXP_ONLY_DIGITS_AND_CHARS, toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import React, { useState } from 'react';
import type { JoinGroupModalProps } from './index.type';

import styles from './index.module.less';

const INVITE_CODE_LENGTH = 8;
const OTP_GROUPS = [
  [0, 1, 2, 3],
  [4, 5, 6, 7],
];

/** 将邀请码规范为 8 位大写字母数字 */
const normalizeInviteCode = (raw = ''): string =>
  raw
    .replace(/[^0-9A-Za-z]/g, '')
    .slice(0, INVITE_CODE_LENGTH)
    .toUpperCase();

function JoinGroupModal({ isOpen, onOpenChange, onSuccess }: JoinGroupModalProps) {
  const groupService = useGroupService();
  const [inviteCode, setInviteCode] = useState('');
  const isConfirmDisabled = normalizeInviteCode(inviteCode).length !== INVITE_CODE_LENGTH;
  const resetForm = () => {
    setInviteCode('');
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  const { loading, run: runJoinGroup } = useRequest(
    async (params: JoinGroupRequest) => groupService.joinGroup(params),
    {
      manual: true,
      onSuccess: () => {
        toast.success('加入小组成功');
        resetForm();
        onSuccess?.();
        onOpenChange(false);
      },
      onError: (err: unknown) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const handleConfirm = () => {
    const normalizedInviteCode = normalizeInviteCode(inviteCode);
    if (normalizedInviteCode.length !== INVITE_CODE_LENGTH) {
      toast.warning('请输入 8 位邀请码');
      return;
    }
    runJoinGroup({
      inviteCode: normalizedInviteCode,
    });
  };

  return (
    <AppModal
      type="confirm"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="加入小组"
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      isConfirmLoading={loading}
      isConfirmDisabled={isConfirmDisabled || loading}
      isDismissable={!loading}
    >
      <label className={styles.fieldLabel} htmlFor="join-group-invite-code">
        邀请码
      </label>
      <InputOTP
        id="join-group-invite-code"
        value={inviteCode}
        onChange={(value) => setInviteCode(normalizeInviteCode(value))}
        className={styles.codeInput}
        inputClassName={styles.codeInputHidden}
        maxLength={INVITE_CODE_LENGTH}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        autoComplete="one-time-code"
        inputMode="text"
        pasteTransformer={normalizeInviteCode}
        pushPasswordManagerStrategy="none"
        textAlign="center"
      >
        {OTP_GROUPS.map((group, groupIndex) => (
          <React.Fragment key={group.join('-')}>
            {groupIndex > 0 ? <InputOTP.Separator className={styles.codeSeparator} /> : null}
            <InputOTP.Group className={styles.codeGroup}>
              {group.map((slotIndex) => (
                <InputOTP.Slot key={slotIndex} className={styles.codeSlot} index={slotIndex} />
              ))}
            </InputOTP.Group>
          </React.Fragment>
        ))}
      </InputOTP>
      <p className={styles.hint}>请输入 8 位邀请码，将自动转为大写并分段显示。</p>
    </AppModal>
  );
}

export default JoinGroupModal;
