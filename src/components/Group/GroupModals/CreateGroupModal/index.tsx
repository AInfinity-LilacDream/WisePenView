import UploadZone from '@/components/Common/UploadZone';
import { useGroupService, useImageService, useUserService } from '@/domains';
import type { CreateGroupRequest } from '@/domains/Group';
import { ALLOWED_GROUP_TYPES_MAP, GROUP_FILE_ORG_LOGIC, GROUP_TYPE } from '@/domains/Group';
import { IDENTITY } from '@/domains/User';
import { parseErrorMessage } from '@/utils/error';
import {
  assertImageProxyUploadLimit,
  IMAGE_UPLOAD_MAX_SIZE_LABEL,
} from '@/utils/image/uploadLimit';
import {
  Button,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextArea,
  TextField,
  toast,
} from '@heroui/react';
import { useRequest } from 'ahooks';
import { useCallback, useState, type FormEvent } from 'react';
import type { CreateGroupModalProps } from './index.type';

import styles from './index.module.less';

type CreateGroupFormValues = Omit<CreateGroupRequest, 'groupCoverUrl'> & {
  cover?: File | null;
};

const groupTypeOptionsBase = GROUP_TYPE.options;

const DEFAULT_FORM_VALUES: CreateGroupFormValues = {
  groupName: '',
  groupDesc: '',
  groupType: GROUP_TYPE.NORMAL,
  cover: null,
};

function CreateGroupModal({ isOpen, onOpenChange, onSuccess }: CreateGroupModalProps) {
  const groupService = useGroupService();
  const imageService = useImageService();
  const userService = useUserService();
  const [formValues, setFormValues] = useState<CreateGroupFormValues>(DEFAULT_FORM_VALUES);
  const [identityType, setIdentityType] = useState<number | undefined>();

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

  const resetForm = useCallback(() => {
    setFormValues(DEFAULT_FORM_VALUES);
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [onOpenChange, resetForm]);

  const updateFormValue = <K extends keyof CreateGroupFormValues>(
    key: K,
    value: CreateGroupFormValues[K]
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCoverChange = (file: File | null) => {
    if (!file) {
      updateFormValue('cover', null);
      return;
    }
    try {
      assertImageProxyUploadLimit(file);
      updateFormValue('cover', file);
    } catch (err) {
      toast.danger(parseErrorMessage(err));
    }
  };

  const { loading: submitting, run: runCreateGroup } = useRequest(
    async (values: CreateGroupFormValues) => {
      let groupCoverUrl = '';
      if (values.cover) {
        const { publicUrl } = await imageService.uploadImage({
          file: values.cover,
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
          fileOrgLogic: GROUP_FILE_ORG_LOGIC.TAG,
        });
        toast.success('创建成功');
      } catch (configErr: unknown) {
        toast.warning(parseErrorMessage(configErr));
      }
    },
    {
      manual: true,
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      },
      onError: (err: unknown) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const validateForm = (): boolean => {
    if (!formValues.groupName.trim()) {
      toast.warning('请输入小组名称');
      return false;
    }
    if (!formValues.groupDesc.trim()) {
      toast.warning('请输入小组描述');
      return false;
    }
    if (!isStudent && !formValues.groupType) {
      toast.warning('请选择小组类型');
      return false;
    }
    return true;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;
    const groupType = isStudent ? GROUP_TYPE.NORMAL : formValues.groupType;
    if (groupType == null) {
      toast.warning('请选择小组类型');
      return;
    }
    runCreateGroup({
      ...formValues,
      groupName: formValues.groupName.trim(),
      groupDesc: formValues.groupDesc.trim(),
      groupType,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleConfirm();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop isDismissable={!submitting}>
        <Modal.Container size="md" placement="center">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>新建小组</Modal.Heading>
            </Modal.Header>
            <Form onSubmit={handleSubmit} className={styles.modalForm}>
              <Modal.Body className={styles.modalBody}>
                <TextField
                  aria-label="小组名称"
                  value={formValues.groupName}
                  onChange={(value) => updateFormValue('groupName', value)}
                  isRequired
                >
                  <Label>小组名称</Label>
                  <Input placeholder="请输入小组名称" />
                </TextField>
                <TextField
                  aria-label="小组描述"
                  value={formValues.groupDesc}
                  onChange={(value) => updateFormValue('groupDesc', value)}
                  isRequired
                >
                  <Label>小组描述</Label>
                  <TextArea rows={4} placeholder="请输入小组描述" />
                </TextField>
                {!isStudent && (
                  <Select
                    aria-label="小组类型"
                    name="groupType"
                    value={String(formValues.groupType)}
                    onChange={(value) => updateFormValue('groupType', Number(value))}
                    isRequired
                  >
                    <Label>小组类型</Label>
                    <Select.Trigger />
                    <Select.Popover>
                      <ListBox>
                        {groupTypeOptions.map((opt) => (
                          <ListBox.Item key={String(opt.value)} id={String(opt.value)}>
                            {opt.label}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                )}
                <div className={styles.coverField}>
                  <span className={styles.fieldLabel}>封面图片</span>
                  <UploadZone
                    file={formValues.cover ?? null}
                    disabled={submitting}
                    accept="image/*"
                    label="点击或拖拽封面图片到此区域"
                    description={`仅可选择单张图片，大小不超过 ${IMAGE_UPLOAD_MAX_SIZE_LABEL}`}
                    onFileChange={handleCoverChange}
                  />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" isDisabled={submitting} onPress={handleCancel}>
                  取消
                </Button>
                <Button type="submit" variant="primary" isDisabled={submitting}>
                  确定
                </Button>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default CreateGroupModal;
