import {
  ACCESS_CONTROL_SCOPE,
  getTagMountPermissionPresetValues,
  getTagPermissionPresetValues,
  normalizeResourceActions,
  TAG_PERMISSION_LIST_ACTIONS,
  TAG_RESOURCE_ACTION,
  type AccessControlScope,
  type TagMountPermissionPresetKey,
  type TagMountPermissionPresetValues,
  type TagPermissionListAction,
  type TagPermissionPresetKey,
  type TagPermissionPresetValues,
  type TagResourceAction,
  type TagTreeNode,
} from '@/domains/Tag';

export type TagPermissionResourceStrategyKey = 'note' | 'file' | 'drawio' | 'aiAsset';

export interface TagPermissionPresetOption {
  key: TagPermissionPresetKey;
  label: string;
  description: string;
  detail: string;
  values?: TagPermissionPresetValues;
}

export interface TagMountPermissionPresetOption {
  key: TagMountPermissionPresetKey;
  label: string;
  description: string;
  detail: string;
  values?: TagMountPermissionPresetValues;
}

export interface TagPermissionResourceStrategy {
  key: TagPermissionResourceStrategyKey;
  label: string;
  supportedActions: TagResourceAction[];
}

export interface TagPermissionActionPresetOption {
  key: Exclude<TagPermissionPresetKey, 'custom'>;
  label: string;
  values: TagPermissionPresetValues;
}

export interface TagPermissionActionRow {
  action: TagPermissionListAction;
  key: string;
  label: string;
  supportedStrategyKeys: TagPermissionResourceStrategyKey[];
}

const ALL_RESOURCE_ACTIONS = TAG_RESOURCE_ACTION.options.map(
  (item) => item.value as TagResourceAction
);

export const TAG_PERMISSION_RESOURCE_STRATEGIES: TagPermissionResourceStrategy[] = [
  {
    key: 'note',
    label: '笔记',
    supportedActions: [
      TAG_RESOURCE_ACTION.DISCOVER,
      TAG_RESOURCE_ACTION.VIEW,
      TAG_RESOURCE_ACTION.EDIT,
      TAG_RESOURCE_ACTION.INLINE_COMMENT,
      TAG_RESOURCE_ACTION.FORK,
      TAG_RESOURCE_ACTION.COMMENT,
    ],
  },
  {
    key: 'file',
    label: '文件',
    supportedActions: ALL_RESOURCE_ACTIONS.filter((action) => action !== TAG_RESOURCE_ACTION.LOAD),
  },
  {
    key: 'drawio',
    label: '画板',
    supportedActions: [
      TAG_RESOURCE_ACTION.DISCOVER,
      TAG_RESOURCE_ACTION.VIEW,
      TAG_RESOURCE_ACTION.EDIT,
      TAG_RESOURCE_ACTION.FORK,
    ],
  },
  {
    key: 'aiAsset',
    label: 'AI 资产',
    supportedActions: ALL_RESOURCE_ACTIONS,
  },
];

export const TAG_PERMISSION_ACTION_ROWS: TagPermissionActionRow[] = TAG_PERMISSION_LIST_ACTIONS.map(
  (action) => ({
    action,
    key: action.key,
    label: action.label,
    supportedStrategyKeys: TAG_PERMISSION_RESOURCE_STRATEGIES.filter((strategy) =>
      strategy.supportedActions.includes(action.action)
    ).map((strategy) => strategy.key),
  })
);

export const TAG_PERMISSION_PRESETS: TagPermissionPresetOption[] = [
  {
    key: 'private',
    label: '私密',
    description: '仅所有者和管理员可访问',
    detail: '适合草稿、归档或尚未准备公开的资料。',
    values: getTagPermissionPresetValues('private'),
  },
  {
    key: 'readonly',
    label: '只读',
    description: '成员可以查看，不能协作修改',
    detail: '适合制度、手册、发布版材料。',
    values: getTagPermissionPresetValues('readonly'),
  },
  {
    key: 'shared',
    label: '共享',
    description: '成员可以阅读、评论和常用协作',
    detail: '适合团队共建资料，默认不开放源文件下载。',
    values: getTagPermissionPresetValues('shared'),
  },
  {
    key: 'custom',
    label: '自定义',
    description: '进入高级权限表格',
    detail: '细调标签级资源权限动作。',
  },
];

export const TAG_MOUNT_PERMISSION_PRESETS: TagMountPermissionPresetOption[] = [
  {
    key: 'all',
    label: '全部',
    description: '所有成员可向此文件夹挂载资源',
    detail: '适合开放协作的资料目录。',
    values: getTagMountPermissionPresetValues('all'),
  },
  {
    key: 'onlyAdmin',
    label: '仅管理员',
    description: '只有管理员可挂载资源',
    detail: '适合结构固定或需要集中维护的目录。',
    values: getTagMountPermissionPresetValues('onlyAdmin'),
  },
  {
    key: 'advanced',
    label: '高级',
    description: '按黑名单或白名单指定成员',
    detail: '细调谁能向该文件夹挂载资源。',
  },
];

export const TAG_PERMISSION_ACTION_PRESET_OPTIONS: TagPermissionActionPresetOption[] =
  TAG_PERMISSION_PRESETS.filter(
    (
      preset
    ): preset is TagPermissionPresetOption & {
      key: Exclude<TagPermissionPresetKey, 'custom'>;
      values: TagPermissionPresetValues;
    } => Boolean(preset.values)
  ).map((preset) => ({
    key: preset.key,
    label: preset.label,
    values: preset.values,
  }));

const createActionSet = (actions: TagResourceAction[] | undefined): Set<TagResourceAction> =>
  new Set(normalizeResourceActions(actions));

const isSameActionSet = (
  left: TagResourceAction[] | undefined,
  right: TagResourceAction[] | undefined
): boolean => {
  const leftSet = createActionSet(left);
  const rightSet = createActionSet(right);
  if (leftSet.size !== rightSet.size) return false;
  return [...leftSet].every((action) => rightSet.has(action));
};

const isPresetValuesMatched = (
  presetValues: TagPermissionPresetValues,
  values: Partial<TagPermissionPresetValues>
): boolean =>
  presetValues.taggedResourceAclGrantScope === values.taggedResourceAclGrantScope &&
  isSameActionSet(presetValues.grantedActions, values.grantedActions);

export const getTagPermissionPresetOption = (
  key: TagPermissionPresetKey
): TagPermissionPresetOption => TAG_PERMISSION_PRESETS.find((preset) => preset.key === key)!;

export const getTagMountPermissionPresetOption = (
  key: TagMountPermissionPresetKey
): TagMountPermissionPresetOption =>
  TAG_MOUNT_PERMISSION_PRESETS.find((preset) => preset.key === key)!;

export const resolveTagPermissionPresetKey = (
  values: Partial<TagPermissionPresetValues>
): TagPermissionPresetKey => {
  const matchedPreset = TAG_PERMISSION_PRESETS.find((preset) => {
    if (!preset.values) return false;
    return isPresetValuesMatched(preset.values, values);
  });
  return matchedPreset?.key ?? 'custom';
};

export const resolveTagPermissionPresetKeyFromTag = (
  tag: TagTreeNode | undefined
): TagPermissionPresetKey => {
  if (!tag) return 'custom';
  return resolveTagPermissionPresetKey({
    taggedResourceAclGrantScope: tag.taggedResourceAclGrantScope,
    grantedActions: tag.grantedActions,
  });
};

export const resolveTagMountPermissionPresetKey = (values: {
  tagMountPermissionScope?: AccessControlScope;
  tagMountSpecifiedUsers?: string[];
}): TagMountPermissionPresetKey => {
  const scope = values.tagMountPermissionScope ?? ACCESS_CONTROL_SCOPE.ALL;
  if (scope === ACCESS_CONTROL_SCOPE.ALL) return 'all';
  if (scope === ACCESS_CONTROL_SCOPE.ONLY_ADMIN) return 'onlyAdmin';
  return 'advanced';
};

export const resolveTagMountPermissionPresetKeyFromTag = (
  tag: TagTreeNode | undefined
): TagMountPermissionPresetKey => {
  if (!tag) return 'advanced';
  return resolveTagMountPermissionPresetKey({
    tagMountPermissionScope: tag.tagMountPermissionScope,
    tagMountSpecifiedUsers: tag.tagMountSpecifiedUsers,
  });
};
