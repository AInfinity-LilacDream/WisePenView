import IconText from '@/components/Common/IconText';
import { useGroupService, useImageService } from '@/domains';
import type { EditGroupRequest, GroupFileOrgLogic, GroupResConfig } from '@/domains/Group';
import { GROUP_FILE_ORG_LOGIC, GROUP_TYPE } from '@/domains/Group';
import {
  actionsToPermissionCode,
  getResourceActionImpliedActions,
  getResourceActionImpliedMask,
  hasResourceAction,
  normalizeResourceActions,
  permissionCodeToActions,
  TAG_RESOURCE_ACTION,
  type TagResourceAction,
} from '@/domains/Tag';
import { createClientError, FRONTEND_CLIENT_ERROR, parseErrorMessage } from '@/utils/error';
import { createBeforeUploadImageWithinLimit } from '@/utils/image/uploadLimit';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { UploadFile } from 'antd';
import { Button, Checkbox, Form, Input, Modal, Radio, Tooltip, Upload } from 'antd';
import { useMemo, useState } from 'react';
import { LuUpload } from 'react-icons/lu';
import type { EditGroupInfoModalProps } from './index.type';

import styles from './index.module.less';

const { TextArea } = Input;

/** 编辑小组表单值（含封面上传） */
type EditGroupFormValues = Pick<EditGroupRequest, 'groupName' | 'groupDesc'> & {
  cover?: UploadFile[];
  fileOrgLogic?: GroupFileOrgLogic;
  defaultMemberActions?: TagResourceAction[];
};

const DEFAULT_MEMBER_ACTIONS: TagResourceAction[] = [
  TAG_RESOURCE_ACTION.DISCOVER,
  TAG_RESOURCE_ACTION.VIEW,
  TAG_RESOURCE_ACTION.DOWNLOAD_WATERMARK,
];

const FILE_ORG_LOGIC_LABEL: Record<GroupFileOrgLogic, string> = {
  [GROUP_FILE_ORG_LOGIC.FOLDER]: '文件夹',
  [GROUP_FILE_ORG_LOGIC.TAG]: '标签',
};

const FILE_ORG_LOGIC_INTRO: Record<GroupFileOrgLogic, string> = {
  [GROUP_FILE_ORG_LOGIC.FOLDER]:
    '文件夹模式：用常规文件夹模式组织资源，同一份资源只能上传到一个文件夹下。',
  [GROUP_FILE_ORG_LOGIC.TAG]: '标签模式：用标签组织资源，同一份资源可以上传到多个标签下。',
};

const fileFromCoverField = (fileList?: UploadFile[]): File | undefined => {
  const item = fileList?.[0];
  const raw = item?.originFileObj;
  return raw instanceof File ? raw : undefined;
};

const getActionLabel = (action: TagResourceAction) =>
  TAG_RESOURCE_ACTION.labels[action] ?? String(action);

const buildInitialConfig = (
  config?: GroupResConfig
): Pick<EditGroupFormValues, 'fileOrgLogic' | 'defaultMemberActions'> => ({
  fileOrgLogic: config?.fileOrgLogic ?? GROUP_FILE_ORG_LOGIC.FOLDER,
  defaultMemberActions: config
    ? normalizeResourceActions(config.defaultMemberActions)
    : DEFAULT_MEMBER_ACTIONS,
});

function EditGroupInfoModal({
  open,
  onCancel,
  groupId,
  groupName = '',
  description = '',
  cover,
  groupType = GROUP_TYPE.NORMAL,
  onSuccess,
}: EditGroupInfoModalProps) {
  const groupService = useGroupService();
  const imageService = useImageService();
  const beforeUploadCover = useMemo(
    () => createBeforeUploadImageWithinLimit((text) => toast.danger(text)),
    []
  );
  const [form] = Form.useForm<EditGroupFormValues>();
  const [hoveredAction, setHoveredAction] = useState<TagResourceAction | null>(null);
  const watchedDefaultMemberActions = Form.useWatch('defaultMemberActions', form);

  const {
    loading: configLoading,
    data: groupResConfig,
    run: runFetchGroupResConfig,
  } = useRequest(
    async (targetGroupId: string): Promise<GroupResConfig> =>
      groupService.fetchGroupResConfig(targetGroupId),
    {
      manual: true,
      onSuccess: (config) => {
        form.setFieldsValue(buildInitialConfig(config));
      },
      onError: (error: unknown) => {
        form.setFieldsValue(buildInitialConfig());
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const isTagModeLocked = groupResConfig?.fileOrgLogic === GROUP_FILE_ORG_LOGIC.TAG;

  const { loading, run: runEditGroup } = useRequest(
    async (formValues: EditGroupFormValues) => {
      if (!groupId) {
        throw createClientError(FRONTEND_CLIENT_ERROR.GROUP_ID_REQUIRED);
      }
      const newFile = fileFromCoverField(formValues.cover);
      let groupCoverUrl = cover ?? '';
      if (newFile) {
        const { publicUrl } = await imageService.uploadImage({
          file: newFile,
          scene: 'PUBLIC_IMAGE_FOR_GROUP',
          bizTag: `groups/${groupId}`,
        });
        groupCoverUrl = publicUrl;
      }
      const params: EditGroupRequest = {
        groupId,
        groupName: formValues.groupName,
        groupDesc: formValues.groupDesc,
        groupCoverUrl,
        groupType,
      };
      await groupService.editGroup(params);
      await groupService.updateGroupResConfig({
        groupId,
        fileOrgLogic: isTagModeLocked
          ? GROUP_FILE_ORG_LOGIC.TAG
          : (formValues.fileOrgLogic ??
            groupResConfig?.fileOrgLogic ??
            GROUP_FILE_ORG_LOGIC.FOLDER),
        defaultMemberActions: normalizeResourceActions(formValues.defaultMemberActions),
      });
    },
    {
      manual: true,
      onSuccess: () => {
        toast.success('小组信息已更新');
        form.resetFields();
        onSuccess?.();
        onCancel();
      },
      onError: (error: unknown) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const normalizeUpload = (e: { fileList?: UploadFile[] } | UploadFile[]) =>
    Array.isArray(e) ? e : (e?.fileList ?? []);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setHoveredAction(null);
      return;
    }
    form.setFieldsValue({
      groupName,
      groupDesc: description,
      ...buildInitialConfig(groupResConfig),
    });
    if (groupId) {
      runFetchGroupResConfig(groupId);
    }
  };

  const handleConfirm = async () => {
    if (!groupId) {
      toast.danger('小组ID不存在');
      return;
    }
    const formValues = await form.validateFields();
    runEditGroup(formValues);
  };

  const selectedActions = normalizeResourceActions(watchedDefaultMemberActions);
  const selectedActionSet = new Set(selectedActions);
  const actionHighlightSet = hoveredAction
    ? new Set([hoveredAction, ...getResourceActionImpliedActions(hoveredAction)])
    : null;

  const handleActionToggle = (action: TagResourceAction, checked: boolean) => {
    const current = (form.getFieldValue('defaultMemberActions') ?? []) as TagResourceAction[];
    if (checked) {
      const nextCode = actionsToPermissionCode([...current, action]);
      form.setFieldValue('defaultMemberActions', permissionCodeToActions(nextCode));
      return;
    }
    const next = normalizeResourceActions(
      current.filter((item) => !hasResourceAction(getResourceActionImpliedMask(item), action))
    );
    form.setFieldValue('defaultMemberActions', next);
  };

  return (
    <Modal
      title="编辑小组信息"
      open={open}
      afterOpenChange={handleOpenChange}
      onCancel={onCancel}
      destroyOnHidden
      wrapClassName={styles.modalWrap}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          loading={loading}
          disabled={configLoading}
        >
          确定
        </Button>,
      ]}
      width={620}
    >
      <Form form={form} layout="vertical" className={styles.modalFormPadding}>
        <Form.Item
          label="小组名称"
          name="groupName"
          rules={[{ required: true, message: '请输入小组名称' }]}
        >
          <Input placeholder="请输入小组名称" />
        </Form.Item>
        <Form.Item label="小组描述" name="groupDesc">
          <TextArea rows={4} placeholder="请输入小组描述（可选）" />
        </Form.Item>
        <Form.Item
          label="封面图片"
          name="cover"
          valuePropName="fileList"
          getValueFromEvent={normalizeUpload}
        >
          <Upload name="file" beforeUpload={beforeUploadCover} accept="image/*" maxCount={1}>
            <Button>
              <IconText icon={<LuUpload />} iconSize={16}>
                点击上传
              </IconText>
            </Button>
          </Upload>
        </Form.Item>
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>资源管理模式</div>
          <Form.Item
            name="fileOrgLogic"
            className={styles.modeRow}
            rules={[{ required: true, message: '请选择资源管理模式' }]}
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              disabled={isTagModeLocked}
              className={isTagModeLocked ? styles.modeDisabled : undefined}
            >
              {GROUP_FILE_ORG_LOGIC.options.map((item) => (
                <Tooltip key={item.key} title={FILE_ORG_LOGIC_INTRO[item.value]}>
                  <Radio.Button value={item.value}>{FILE_ORG_LOGIC_LABEL[item.value]}</Radio.Button>
                </Tooltip>
              ))}
            </Radio.Group>
          </Form.Item>
          <div className={styles.modeHint}>只能从文件夹模式切换至标签模式</div>
        </div>
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>小组成员默认权限</div>
          <Form.Item label="新成员默认可用的资源权限" className={styles.actionGroup}>
            <Form.Item name="defaultMemberActions" hidden>
              <Input />
            </Form.Item>
            <div className={styles.actionList}>
              {TAG_RESOURCE_ACTION.options.map((item) => {
                const action = item.value as TagResourceAction;
                const impliedActions = getResourceActionImpliedActions(action);
                const impliedLabels = impliedActions.map((value) => getActionLabel(value));
                const isHighlighted = actionHighlightSet?.has(action);
                return (
                  <div
                    key={item.key}
                    className={
                      isHighlighted
                        ? `${styles.actionItem} ${styles.actionItemHighlight}`
                        : styles.actionItem
                    }
                    onMouseEnter={() => setHoveredAction(action)}
                    onMouseLeave={() => setHoveredAction(null)}
                  >
                    <Checkbox
                      checked={selectedActionSet.has(action)}
                      onChange={(event) => handleActionToggle(action, event.target.checked)}
                    >
                      <span className={styles.actionLabel}>{item.label}</span>
                    </Checkbox>
                    {impliedLabels.length > 0 ? (
                      <div className={styles.actionHint}>包含：{impliedLabels.join(' / ')}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}

export default EditGroupInfoModal;
