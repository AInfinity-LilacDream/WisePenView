import AdminUserTable from '@/components/Admin/UserTable';
import { useAdminService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import AdminPageHeader from '@/views/admin/_common/AdminPageHeader';
import { ADMIN_PAGE_CONFIGS } from '@/views/admin/pages';
import { toast } from '@heroui/react';
import { usePagination } from 'ahooks';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../style.module.less';

const DEFAULT_PAGE_SIZE = 10;

function UserManagement() {
  const page = ADMIN_PAGE_CONFIGS.users;
  const adminService = useAdminService();
  const navigate = useNavigate();

  const {
    data,
    loading,
    pagination: { current = 1, pageSize = DEFAULT_PAGE_SIZE, onChange },
  } = usePagination(
    async ({ current: nextPage, pageSize: nextPageSize }) => {
      const res = await adminService.fetchUserList({
        page: nextPage,
        size: nextPageSize,
      });

      return {
        list: res.users,
        total: res.total,
      };
    },
    {
      defaultCurrent: 1,
      defaultPageSize: DEFAULT_PAGE_SIZE,
      refreshDeps: [adminService],
      onError: (err) => {
        toast.danger(parseErrorMessage(err));
      },
    }
  );

  const handleOpenUser = useCallback(
    (userId: string) => {
      navigate(`/admin/users/${userId}`);
    },
    [navigate]
  );

  return (
    <div className={styles.pageContainer}>
      <AdminPageHeader title={page.title} subtitle={page.subtitle} />
      <AdminUserTable
        users={data?.list ?? []}
        loading={loading}
        total={data?.total ?? 0}
        currentPage={current}
        pageSize={pageSize}
        onPageChange={onChange}
        onRowClick={handleOpenUser}
        onEditUser={handleOpenUser}
      />
    </div>
  );
}

export default UserManagement;
