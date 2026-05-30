import IconText from '@/components/Common/IconText';
import { useGroupService, useImageService, useUserService } from '@/domains';
import type { CreateGroupRequest, GroupFileOrgLogic } from '@/domains/Group';
import {
  ALLOWED_GROUP_TYPES_MAP,
  DEFAULT_MEMBER_ACTIONS,
  FILE_ORG_LOGIC_INTRO,
  FILE_ORG_LOGIC_LABEL,
  GROUP_FILE_ORG_LOGIC,
  GROUP_TYPE,
} from '@/domains/Group';
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
import { IDENTITY } from '@/domains/User';
import { parseErrorMessage } from '@/utils/error';
import { createBeforeUploadImageWithinLimit } from '@/utils/image/uploadLimit';
import { toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { UploadFile } from 'antd';
import { Button, Checkbox, Form, Input, Modal, Radio, Select, Tooltip, Upload } from 'antd';
import { useMemo, useState } from 'react';
import { LuUpload } from 'react-icons/lu';
import type { CreateGroupModalProps } from './index.type';

import styles from './index.module.less';

const { TextArea } = Input;
const { Option } = Select;

type CreateGroupFormValues = Omit<CreateGroupRequest, 'groupCoverUrl'> & {
  cover?: UploadFile[];
  fileOrgLogic?: GroupFileOrgLogic;
  defaultMemberActions?: TagResourceAction[];
};

const fileFromCoverField = (fileList?: UploadFile[]): File | undefined => {
  const item = fileList?.[0];
  const raw = item?.originFileObj;
  return raw instanceof File ? raw : undefined;
};

const groupTypeOptionsBase = GROUP_TYPE.options;

const getActionLabel = (action: TagResourceAction) =>
  TAG_RESOURCE_ACTION.labels[action] ?? String(action);

function CreateGroupModal({ open, onCancel, onSuccess }: CreateGroupModalProps) {
  const groupService = useGroupService();
  const imageService = useImageService();
  const userService = useUserService();
  const beforeUploadCover = useMemo(
    () => createBeforeUploadImageWithinLimit((text) => toast.danger(text)),
    []
  );
  const [form] = Form.useForm<CreateGroupFormValues>();
  const [identityType, setIdentityType] = useState<number | undefined>();
  const [hoveredAction, setHoveredAction] = useState<TagResourceAction | null>(null);
  const watchedDefaultMemberActions = Form.useWatch('defaultMemberActions', form);
  const watchedFileOrgLogic = Form.useWatch('fileOrgLogic', form);

  useRequest(() => userService.getUserInfo(), {
    onSuccess: (u) => {
      setIdentityType(u.identityType);
    },
  });

  const isStudent = identityType === IDENTITY.STUDENT;
  const allowedGroupTypes = ALLOWED_GROUP_TYPES_MAP[identityType ?? 3];
  const groupTypeOptions = groupTypeOptionsBase.filter((opt) =>
    allowedGroupTypes.includes(opt.value)
  );

  const handleCancel = () => {
    form.resetFields();
    setHoveredAction(null);
    onCancel();
  };

  const normalizeUpload = (e: { fileList?: UploadFile[] } | UploadFile[]) =>
    Array.isArray(e) ? e : (e?.fileList ?? []);

  const { loading: submitting, run: runCreateGroup } = useRequest(
    async (values: CreateGroupFormValues) => {
      const coverFile = fileFromCoverField(values.cover);
      let groupCoverUrl = '';
      if (coverFile) {
        const { publicUrl } = await imageService.uploadImage({
          file: coverFile,
          scene: 'PUBLIC_IMAGE_FOR_GROUP',
          bizTag: 'groups',
        });
        groupCoverUrl = publicUrl;
      }
      const groupId = await groupService.createGroup({
        groupName: values.groupName,
        groupType: isStudent ? GROUP_TYPE.NORMAL : values.groupType,
        groupDesc: values.groupDesc,
        groupCoverUrl,
      });
      try {
        await groupService.updateGroupResConfig({
          groupId,
          fileOrgLogic: values.fileOrgLogic ?? GROUP_FILE_ORG_LOGIC.FOLDER,
          defaultMemberActions: normalizeResourceActions(
            values.defaultMemberActions ?? DEFAULT_MEMBER_ACTIONS
          ),
        });
        toast.success('创建成功');
      } catch (configErr: unknown) {
        toast.warning(parseErrorMessage(configErr));
      }
    },
    {
      manual: true,
      onSuccess: () => {
        form.resetFields();
        onCancel();
        onSuccess?.();
      },
      onError: (err: unknown) => {
        const isValidationError =
          err != null &&
          typeof err === 'object' &&
          'errorFields' in err &&
          Array.isArray((err as { errorFields?: unknown }).errorFields);
        if (!isValidationError) {
          toast.danger(parseErrorMessage(err));
        }
      },
    }
  );

  const handleConfirm = async () => {
    const values = await form.validateFields();
    runCreateGroup(values);
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
      title="新建小组"
      open={open}
      onCancel={handleCancel}
      destroyOnHidden
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} loading={submitting}>
          确定
        </Button>,
      ]}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        className={styles.modalFormPadding}
        initialValues={{
          fileOrgLogic: GROUP_FILE_ORG_LOGIC.FOLDER,
          defaultMemberActions: DEFAULT_MEMBER_ACTIONS,
        }}
      >
        <Form.Item
          label="小组名称"
          name="groupName"
          rules={[{ required: true, message: '请输入小组名称' }]}
        >
          <Input placeholder="请输入小组名称" />
        </Form.Item>
        <Form.Item
          label="小组描述"
          name="groupDesc"
          rules={[{ required: true, message: '请输入小组描述' }]}
        >
          <TextArea rows={4} placeholder="请输入小组描述" />
        </Form.Item>
        {!isStudent && (
          <Form.Item
            label="小组类型"
            name="groupType"
            initialValue={GROUP_TYPE.NORMAL}
            rules={[{ required: true, message: '请选择小组类型' }]}
          >
            <Select>
              {groupTypeOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}
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
            <Radio.Group optionType="button" buttonStyle="solid">
              {GROUP_FILE_ORG_LOGIC.options.map((item) => (
                <Tooltip key={item.key} title={FILE_ORG_LOGIC_INTRO[item.value]}>
                  <Radio.Button value={item.value}>{FILE_ORG_LOGIC_LABEL[item.value]}</Radio.Button>
                </Tooltip>
              ))}
            </Radio.Group>
          </Form.Item>
          <div className={styles.modeHint}>注意：设置为标签模式后无法改回文件夹模式</div>
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

export default CreateGroupModal;
