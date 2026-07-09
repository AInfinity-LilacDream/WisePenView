import QuotaBar from '@/components/QuotaBar';
import { DataTable, type DataTableColumn } from '@/components/Table';
import { useQuotaService } from '@/domains';
import { parseErrorMessage } from '@/utils/error';
import { toast, type SortDescriptor } from '@heroui/react';
import { usePagination } from 'ahooks';
import { useMemo, useState } from 'react';
import type { QuotaByGroupProps, UserGroupQuota } from './index.type';
import styles from './style.module.less';

type QuotaRecord = UserGroupQuota & { key: string };

const DEFAULT_PAGE_SIZE = 10;

function QuotaByGroup({ pagination }: QuotaByGroupProps) {
  const quotaService = useQuotaService();
  const {
    data: quotaData,
    loading,
    pagination: {
      current: currentPage = 1,
      pageSize = pagination?.defaultPageSize ?? DEFAULT_PAGE_SIZE,
      onChange,
    },
  } = usePagination(
    async ({ current, pageSize: nextPageSize }) => {
      const { quotas, total } = await quotaService.fetchUserGroupQuotas(current, nextPageSize);
      return { list: quotas, total };
    },
    {
      defaultCurrent: 1,
      defaultPageSize: pagination?.defaultPageSize ?? DEFAULT_PAGE_SIZE,
      onError: (error: unknown) => {
        toast.danger(parseErrorMessage(error));
      },
    }
  );

  const quotas: UserGroupQuota[] = useMemo(() => quotaData?.list ?? [], [quotaData?.list]);
  const total = quotaData?.total ?? 0;
  const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  const dataSource = useMemo(
    () => quotas.map((quota) => ({ ...quota, key: quota.groupId || quota.groupName })),
    [quotas]
  );

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'groupName',
    direction: 'ascending',
  });

  const columns = useMemo<DataTableColumn<QuotaRecord>[]>(
    () => [
      {
        id: 'groupName',
        label: '小组',
        width: 'md',
        align: 'start',
        allowsSorting: true,
        isRowHeader: true,
        getSortValue: (row) => row.groupName,
        renderCell: (row) => (
          <DataTable.TextCell emphasis className={styles.groupNameItem}>
            {row.groupName || '未命名小组'}
          </DataTable.TextCell>
        ),
      },
      {
        id: 'quotaUsed',
        label: '配额使用',
        width: 'fill',
        align: 'start',
        allowsSorting: true,
        getSortValue: (row) => row.quotaUsed,
        renderCell: (row) => (
          <div className={styles.quotaItem}>
            <QuotaBar used={row.quotaUsed} limit={row.quotaLimit} />
          </div>
        ),
      },
    ],
    []
  );

  const summary = total > 0 ? `${start}-${end} / 共 ${total} 个高级组` : '暂无高级组配额';

  return (
    <div>
      <DataTable
        ariaLabel="我的高级组配额"
        className={styles.table}
        items={dataSource}
        rowKey="key"
        columns={columns}
        loading={loading}
        emptyText="暂无高级组配额"
        title="我的高级组配额"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        summary={summary}
        pagination={{
          total,
          current: currentPage,
          pageSize,
          onChange,
        }}
      />
    </div>
  );
}

export default QuotaByGroup;
