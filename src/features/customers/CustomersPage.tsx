import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowRight, Download, Repeat2, SearchX, UserPlus, Users } from 'lucide-react';
import { customers, customerStats } from '../../data/mock';
import type { Customer, CustomerSegment } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRelativeMinutes,
  localized,
} from '../../lib/format';
import { customerSegmentMeta } from '../../lib/status';
import { Avatar, SegmentedControl, StatusBadge } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { CompactStats } from '../../components/ui/CompactStats';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { EmptyState, PageHeader, Panel } from '../../components/ui/Panel';
import { Pagination } from '../../components/ui/Pagination';
import { SearchBox } from '../../components/ui/SearchBox';
import styles from './CustomersPage.module.css';

type SegmentFilter = CustomerSegment | 'all';
const PAGE_SIZE = 6;

export default function CustomersPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<SegmentFilter>('all');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(
    () => ({
      all: customers.length,
      vip: customers.filter((customer) => customer.segment === 'vip').length,
      new: customers.filter((customer) => customer.segment === 'new').length,
      regular: customers.filter((customer) => customer.segment === 'regular').length,
      at_risk: customers.filter((customer) => customer.segment === 'at_risk').length,
    }),
    [],
  );

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return customers.filter((customer) => {
      if (segment !== 'all' && customer.segment !== segment) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [
        customer.name.en,
        customer.name.ar,
        customer.email,
        customer.phone,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [deferredSearch, segment]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const columns: Column<Customer>[] = [
    {
      key: 'customer',
      header: t('customers.table.customer'),
      render: (customer) => (
        <div className={styles.customerCell}>
          <Avatar name={localized(customer.name, locale)} tone={customer.tone} size="sm" />
          <div className={styles.customerCopy}>
            <span className={styles.customerName}>{localized(customer.name, locale)}</span>
            <span className={styles.customerEmail}>{customer.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: t('customers.table.contact'),
      render: (customer) => <span className={`${styles.phone} force-ltr`}>{customer.phone}</span>,
    },
    {
      key: 'orders',
      header: t('customers.table.orders'),
      align: 'center',
      render: (customer) => <span className={styles.orders}>{formatNumber(customer.orders, locale)}</span>,
    },
    {
      key: 'spend',
      header: t('customers.table.spend'),
      align: 'end',
      render: (customer) => <span className={styles.spend}>{formatCurrency(customer.spend, locale)}</span>,
    },
    {
      key: 'lastOrder',
      header: t('customers.table.lastOrder'),
      render: (customer) => (
        <span className={styles.lastOrder}>
          {formatRelativeMinutes(customer.lastOrderMinutes, locale)}
        </span>
      ),
    },
    {
      key: 'segment',
      header: t('customers.table.segment'),
      render: (customer) => <StatusBadge meta={customerSegmentMeta[customer.segment]} />,
    },
    {
      key: 'action',
      header: t('customers.table.action'),
      align: 'end',
      render: () => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast(t('customers.viewToast'))}
          iconEnd={<ArrowRight className="icon-directional" size={13} strokeWidth={1.9} aria-hidden="true" />}
        >
          {t('common.view')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t('customers.eyebrow')}
        title={t('customers.title')}
        description={t('customers.subtitle')}
        actions={
          <Button
            variant="secondary"
            icon={<Download size={15} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => toast(t('customers.exportToast'))}
          >
            {t('customers.export')}
          </Button>
        }
      />

      <CompactStats
        items={[
          {
            icon: <Users size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('customers.statTotal'),
            value: formatNumber(customerStats.total, locale),
          },
          {
            icon: <UserPlus size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('customers.statNew'),
            value: formatNumber(customerStats.newThisMonth, locale),
            tone: 'success',
          },
          {
            icon: <Repeat2 size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('customers.statRepeat'),
            value: formatPercent(customerStats.repeatRate, locale),
            tone: 'accent',
          },
        ]}
      />

      <div className={styles.filters}>
        <SearchBox
          className={styles.search}
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={t('customers.searchPlaceholder')}
          ariaLabel={t('a11y.search')}
        />
        <SegmentedControl
          ariaLabel={t('customers.segmentAll')}
          value={segment}
          onChange={(value) => {
            setSegment(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('customers.segmentAll'), count: counts.all },
            { value: 'vip', label: t('customers.segmentVip'), count: counts.vip },
            { value: 'new', label: t('customers.segmentNew'), count: counts.new },
            { value: 'regular', label: t('customers.segmentRegular'), count: counts.regular },
            { value: 'at_risk', label: t('customers.segmentAtRisk'), count: counts.at_risk },
          ]}
        />
      </div>

      <Panel padded={false} className={styles.tableCard}>
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(customer) => customer.id}
          caption={t('customers.title')}
          empty={
            <EmptyState
              icon={<SearchX size={22} strokeWidth={1.8} aria-hidden="true" />}
              title={t('customers.noResultsTitle')}
              body={t('customers.noResultsBody')}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setSegment('all');
                  }}
                >
                  {t('orders.clearFilters')}
                </Button>
              }
            />
          }
          mobileCard={(customer) => (
            <div className={styles.mobileCustomer}>
              <div className={styles.mobileTop}>
                <div className={styles.customerCell}>
                  <Avatar name={localized(customer.name, locale)} tone={customer.tone} />
                  <div className={styles.customerCopy}>
                    <span className={styles.customerName}>{localized(customer.name, locale)}</span>
                    <span className={styles.customerEmail}>{customer.email}</span>
                  </div>
                </div>
                <StatusBadge meta={customerSegmentMeta[customer.segment]} />
              </div>
              <div className={styles.mobileStats}>
                <span>
                  <span className={styles.mobileLabel}>{t('customers.table.orders')}</span>
                  {formatNumber(customer.orders, locale)}
                </span>
                <span>
                  <span className={styles.mobileLabel}>{t('customers.table.spend')}</span>
                  {formatCurrency(customer.spend, locale)}
                </span>
                <span>
                  <span className={styles.mobileLabel}>{t('customers.table.lastOrder')}</span>
                  {formatRelativeMinutes(customer.lastOrderMinutes, locale)}
                </span>
              </div>
              <div className={styles.mobileFooter}>
                <span className={`${styles.phone} force-ltr`}>{customer.phone}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast(t('customers.viewToast'))}
                >
                  {t('common.view')}
                </Button>
              </div>
            </div>
          )}
        />

        {filtered.length > 0 && (
          <Pagination
            page={safePage}
            pageCount={pageCount}
            onPageChange={setPage}
            from={from}
            to={to}
            total={filtered.length}
          />
        )}
      </Panel>
    </div>
  );
}
