import { useAdminService } from '@/domains';
import type { AdminUser } from '@/domains/Admin';
import {
DEGREE,
getVerificationModeLabel,
IDENTITY,
SEX,
USER_STATUS,
type UserVerificationMode,
} from '@/domains/User/enum';
import { parseErrorMessage } from '@/utils/error';
import { formatTimestampToDateTime } from '@/utils/format/formatTime';
import AdminPageHeader from '@/views/admin/_common/AdminPageHeader';
import { Alert,Button,Card,Skeleton,Tabs,toast } from '@heroui/react';
import { useRequest } from 'ahooks';
import type { ReactNode } from 'react';
import { RiArrowLeftLine } from 'react-icons/ri';
import { useNavigate,useParams } from 'react-router-dom';
import pageStyles from '../style.module.less';
import styles from './style.module.less';

const EMPTY_TEXT = '-';

type UserDetailData = {
  user?: AdminUser;
  userProfile?: Record<string, unknown> | null;
  readonlyFields?: string[] | null;
};

type DetailItem = {
  key: string;
  label: string;
  value: ReactNode;
};

type DetailTab = {
  key: string;
  label: string;
  content: ReactNode;
};

const formatOptionalText = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return EMPTY_TEXT;
  if (typeof value === 'string') return value.trim() || EMPTY_TEXT;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
};

const formatVerificationMode = (value: unknown): string => {
  if (value === 1) return getVerificationModeLabel('EDU_EMAIL');
  if (value === 2) return getVerificationModeLabel('FDU_UIS_SYS');
  if (typeof value === 'string') {
    return getVerificationModeLabel(value as UserVerificationMode);
  }
  return EMPTY_TEXT;
};

const formatTimeValue = (value: unknown): string => {
  if (typeof value === 'number' || typeof value === 'string') {
    return formatTimestampToDateTime(value) || formatOptionalText(value);
  }
  return formatOptionalText(value);
};

const createBasicItems = (user?: AdminUser): DetailItem[] => [
  { key: 'id', label: '用户 ID', value: formatOptionalText(user?.id) },
  { key: 'username', label: '用户名', value: formatOptionalText(user?.username) },
  { key: 'realName', label: '姓名', value: formatOptionalText(user?.realName) },
  { key: 'nickname', label: '昵称', value: formatOptionalText(user?.nickname) },
  { key: 'identityType', label: '身份', value: IDENTITY.getLabel(user?.identityType ?? '') },
  { key: 'status', label: '状态', value: USER_STATUS.getLabel(user?.status ?? '') },
  { key: 'campusNo', label: '学工号', value: formatOptionalText(user?.campusNo) },
  { key: 'email', label: '邮箱', value: formatOptionalText(user?.email) },
  { key: 'mobile', label: '手机', value: formatOptionalText(user?.mobile) },
  {
    key: 'verificationMode',
    label: '认证方式',
    value: formatVerificationMode(user?.verificationMode),
  },
  { key: 'createTime', label: '创建时间', value: formatOptionalText(user?.createTime) },
  { key: 'updateTime', label: '更新时间', value: formatOptionalText(user?.updateTime) },
];

const createProfileItems = (profile?: Record<string, unknown> | null): DetailItem[] => [
  { key: 'sex', label: '性别', value: SEX.getLabel(Number(profile?.sex ?? 2)) },
  { key: 'university', label: '学校', value: formatOptionalText(profile?.university) },
  { key: 'college', label: '学院', value: formatOptionalText(profile?.college) },
  { key: 'major', label: '专业', value: formatOptionalText(profile?.major) },
  { key: 'className', label: '班级', value: formatOptionalText(profile?.className) },
  {
    key: 'enrollmentYear',
    label: '入学年份',
    value: formatOptionalText(profile?.enrollmentYear),
  },
  {
    key: 'degreeLevel',
    label: '学历层次',
    value:
      profile?.degreeLevel === undefined || profile?.degreeLevel === null
        ? EMPTY_TEXT
        : DEGREE.getLabel(Number(profile.degreeLevel)),
  },
  { key: 'academicTitle', label: '职称', value: formatOptionalText(profile?.academicTitle) },
  {
    key: 'profileCreateTime',
    label: '档案创建时间',
    value: formatTimeValue(profile?.createTime),
  },
  {
    key: 'profileUpdateTime',
    label: '档案更新时间',
    value: formatTimeValue(profile?.updateTime),
  },
];

const renderAlert = (title: string, description?: string) => (
  <Alert status="danger">
    <Alert.Indicator />
    <Alert.Content>
      <Alert.Title>{title}</Alert.Title>
      {description ? <Alert.Description>{description}</Alert.Description> : null}
    </Alert.Content>
  </Alert>
);

const renderDetailGrid = (items: DetailItem[]) => (
  <dl className={styles.detailGrid}>
    {items.map((item) => (
      <div className={styles.detailItem} key={item.key}>
        <dt className={styles.detailLabel}>{item.label}</dt>
        <dd className={styles.detailValue}>{item.value}</dd>
      </div>
    ))}
  </dl>
);

const renderPendingSection = (description: string) => (
  <Card className={styles.placeholderCard}>
    <Card.Content className={styles.placeholderContent}>{description}</Card.Content>
  </Card>
);

function DetailSkeleton() {
  return (
    <div className={styles.cardStack}>
      <Card className={styles.detailCard}>
        <Card.Header>
          <Skeleton className={styles.titleSkeleton} />
        </Card.Header>
        <Card.Content className={styles.skeletonGrid}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton className={styles.itemSkeleton} key={index} />
          ))}
        </Card.Content>
      </Card>
    </div>
  );
}

function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const adminService = useAdminService();

  const { data, loading, error } = useRequest<UserDetailData, []>(
    async () => {
      if (!userId) return {};
      const [listRes, detailRes] = await Promise.all([
        adminService.fetchUserList({ page: 1, size: 1, keyword: userId }),
        adminService.getUserInfo({ userId }),
      ]);

      return {
        user:
          detailRes.user ?? listRes.users.find((item) => item.id === userId) ?? listRes.users[0],
        userProfile: detailRes.userProfile,
        readonlyFields: detailRes.readonlyFields,
      };
    },
    {
      ready: Boolean(userId),
      refreshDeps: [adminService, userId],
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  if (!userId) {
    return <div className={pageStyles.pageContainer}>{renderAlert('缺少用户 ID')}</div>;
  }

  const personalInfoContent = loading ? (
    <DetailSkeleton />
  ) : error ? (
    renderAlert('用户详情加载失败', parseErrorMessage(error))
  ) : (
    <div className={styles.cardStack}>
      <Card className={styles.detailCard}>
        <Card.Header>
          <Card.Title>基础信息</Card.Title>
        </Card.Header>
        <Card.Content>{renderDetailGrid(createBasicItems(data?.user))}</Card.Content>
      </Card>
      <Card className={styles.detailCard}>
        <Card.Header>
          <Card.Title>档案信息</Card.Title>
        </Card.Header>
        <Card.Content>{renderDetailGrid(createProfileItems(data?.userProfile))}</Card.Content>
      </Card>
    </div>
  );

  const tabs: DetailTab[] = [
    {
      key: 'profile',
      label: '用户个人信息',
      content: personalInfoContent,
    },
    {
      key: 'groups',
      label: '用户组',
      content: renderPendingSection('后续接入用户管理的组与加入的组。'),
    },
    {
      key: 'tokens',
      label: 'Token 余额/用量',
      content: renderPendingSection('后续接入用户 token 余额、用量与流水。'),
    },
    {
      key: 'resources',
      label: '资源发布/编辑历史',
      content: renderPendingSection('后续接入用户资源发布与编辑历史。'),
    },
    {
      key: 'documents',
      label: '文档/历史',
      content: renderPendingSection('后续接入用户创建、拥有的文档与历史。'),
    },
    {
      key: 'sessions',
      label: '聊天会话历史',
      content: renderPendingSection('后续接入用户聊天会话历史。'),
    },
    {
      key: 'aiSessions',
      label: 'AI 会话历史',
      content: renderPendingSection('后续接入用户与 AI 的聊天会话历史。'),
    },
  ];

  return (
    <div className={pageStyles.pageContainer}>
      <div className={styles.pageStack}>
        <div className={styles.toolbar}>
          <Button onPress={() => navigate('/admin/users')}>
            <RiArrowLeftLine />
            返回
          </Button>
        </div>
        <AdminPageHeader title="用户详情" subtitle={`查看用户 ${userId} 的管理信息`} />
        <Tabs defaultSelectedKey="profile" className={styles.tabs}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="用户详情栏目">
              {tabs.map((tab) => (
                <Tabs.Tab id={tab.key} key={tab.key}>
                  {tab.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
          {tabs.map((tab) => (
            <Tabs.Panel className={styles.tabPanel} id={tab.key} key={tab.key}>
              {tab.content}
            </Tabs.Panel>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

export default UserDetail;
