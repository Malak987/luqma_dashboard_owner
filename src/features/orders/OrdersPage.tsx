import { useDeferredValue, useMemo, useState } from 'react';
import { Download, Eye, Plus, SearchX } from 'lucide-react';
import { orders } from '../../data/mock';
import type { Order, OrderStatus } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import { formatCurrency, formatRelativeMinutes, localized } from '../../lib/format';
import { orderStatusMeta, paymentLabelKey } from '../../lib/status';
import { Avatar, SegmentedControl, StatusBadge } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { EmptyState, PageHeader, Panel } from '../../components/ui/Panel';
import { SearchBox } from '../../components/ui/SearchBox';
import { Select } from '../../components/ui/Field';
import { Pagination } from '../../components/ui/Pagination';
import { OrderDrawer } from './OrderDrawer';
import styles from './OrdersPage.module.css';

type StatusFilter = OrderStatus | 'all';
type PaymentFilter = Order['payment'] | 'all';

const PAGE_SIZE = 6;

export default function OrdersPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const [status, setStatus] = useState<StatusFilter>('all');
  const [payment, setPayment] = useState<PaymentFilter>('all');
  const [restaurant, setRestaurant] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((order) => order.status === 'pending').length,
      preparing: orders.filter((order) => order.status === 'preparing').length,
      on_the_way: orders.filter((order) => order.status === 'on_the_way').length,
      delivered: orders.filter((order) => order.status === 'delivered').length,
      cancelled: orders.filter((order) => order.status === 'cancelled').length,
    } satisfies Record<StatusFilter, number>;
  }, []);

  const restaurantOptions = useMemo(() => {
    const unique = new Map<string, string>();
    orders.forEach((order) => {
      unique.set(order.restaurant.en, localized(order.restaurant, locale));
    });
    return [
      { value: 'all', label: t('orders.allRestaurants') },
      ...Array.from(unique, ([value, label]) => ({ value, label })),
    ];
  }, [locale, t]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) {
        return false;
      }
      if (payment !== 'all' && order.payment !== payment) {
        return false;
      }
      if (restaurant !== 'all' && order.restaurant.en !== restaurant) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        order.id,
        order.customer.en,
        order.customer.ar,
        order.restaurant.en,
        order.restaurant.ar,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [deferredSearch, payment, restaurant, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const hasFilters = Boolean(search) || status !== 'all' || payment !== 'all' || restaurant !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    setPayment('all');
    setRestaurant('all');
    setPage(1);
  };

  const columns: Column<Order>[] = [
    {
      key: 'order',
      header: t('orders.table.order'),
      render: (order) => (
        <div className={styles.orderCell}>
          <span className={styles.orderId}>{order.id}</span>
          <span className={styles.orderItems}>
            {t('common.items', { count: order.lines.length })}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: t('orders.table.customer'),
      render: (order) => (
        <div className={styles.customerCell}>
          <Avatar name={localized(order.customer, locale)} tone={0} size="sm" />
          <span>{localized(order.customer, locale)}</span>
        </div>
      ),
    },
    {
      key: 'restaurant',
      header: t('orders.table.restaurant'),
      render: (order) => localized(order.restaurant, locale),
    },
    {
      key: 'items',
      header: t('orders.table.items'),
      align: 'center',
      render: (order) => <span className={styles.itemsCount}>{order.lines.length}</span>,
    },
    {
      key: 'total',
      header: t('orders.table.total'),
      align: 'end',
      render: (order) => <span className={styles.amount}>{formatCurrency(order.total, locale)}</span>,
    },
    {
      key: 'payment',
      header: t('orders.table.payment'),
      render: (order) => <span className={styles.payment}>{t(paymentLabelKey[order.payment])}</span>,
    },
    {
      key: 'status',
      header: t('orders.table.status'),
      render: (order) => <StatusBadge meta={orderStatusMeta[order.status]} />,
    },
    {
      key: 'time',
      header: t('orders.table.time'),
      align: 'end',
      render: (order) => (
        <span className={styles.time}>{formatRelativeMinutes(order.minutesAgo, locale)}</span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'end',
      render: (order) => (
        <IconButton
          label={t('orders.table.view')}
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedOrder(order);
          }}
        >
          <Eye size={14} strokeWidth={1.8} aria-hidden="true" />
        </IconButton>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t('orders.eyebrow')}
        title={t('orders.title')}
        description={t('orders.subtitle')}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download size={15} strokeWidth={1.8} aria-hidden="true" />}
              onClick={() => toast(t('orders.exportToast'))}
            >
              {t('orders.export')}
            </Button>
            <Button
              icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />}
              onClick={() => toast(t('orders.newOrderToast'))}
            >
              {t('orders.newOrder')}
            </Button>
          </>
        }
      />

      <div className={styles.tabs}>
        <SegmentedControl
          ariaLabel={t('orders.table.status')}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('orders.tabAll'), count: counts.all },
            { value: 'pending', label: t('orders.tabPending'), count: counts.pending },
            { value: 'preparing', label: t('orders.tabPreparing'), count: counts.preparing },
            { value: 'on_the_way', label: t('orders.tabOnTheWay'), count: counts.on_the_way },
            { value: 'delivered', label: t('orders.tabDelivered'), count: counts.delivered },
            { value: 'cancelled', label: t('orders.tabCancelled'), count: counts.cancelled },
          ]}
        />
        <span className={styles.sampleNote}>{t('orders.sampleNote')}</span>
      </div>

      <Panel padded={false} className={styles.tableCard}>
        <div className={styles.toolbar}>
          <SearchBox
            className={styles.search}
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder={t('orders.searchPlaceholder')}
            ariaLabel={t('a11y.search')}
          />
          <Select
            label={t('orders.table.restaurant')}
            hideLabel
            value={restaurant}
            onChange={(event) => {
              setRestaurant(event.target.value);
              setPage(1);
            }}
            options={restaurantOptions}
            containerClassName={styles.select}
          />
          <Select
            label={t('orders.table.payment')}
            hideLabel
            value={payment}
            onChange={(event) => {
              setPayment(event.target.value as PaymentFilter);
              setPage(1);
            }}
            options={[
              { value: 'all', label: t('orders.allPayments') },
              { value: 'card', label: t('payment.card') },
              { value: 'cash', label: t('payment.cash') },
              { value: 'wallet', label: t('payment.wallet') },
            ]}
            containerClassName={styles.select}
          />
        </div>

        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(order) => order.id}
          caption={t('orders.title')}
          onRowClick={setSelectedOrder}
          empty={
            <EmptyState
              icon={<SearchX size={22} strokeWidth={1.8} aria-hidden="true" />}
              title={t('orders.noResultsTitle')}
              body={t('orders.noResultsBody')}
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    {t('orders.clearFilters')}
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={(order) => (
            <button
              type="button"
              className={styles.mobileOrder}
              onClick={() => setSelectedOrder(order)}
            >
              <span className={styles.mobileTop}>
                <span className={styles.orderId}>{order.id}</span>
                <StatusBadge meta={orderStatusMeta[order.status]} />
              </span>
              <span className={styles.mobileMid}>
                <span>
                  <Avatar name={localized(order.customer, locale)} tone={0} size="sm" />
                  {localized(order.customer, locale)}
                </span>
                <span>{localized(order.restaurant, locale)}</span>
              </span>
              <span className={styles.mobileBottom}>
                <span className={styles.payment}>{t(paymentLabelKey[order.payment])}</span>
                <span className={styles.amount}>{formatCurrency(order.total, locale)}</span>
                <span className={styles.time}>{formatRelativeMinutes(order.minutesAgo, locale)}</span>
              </span>
            </button>
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

      <OrderDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
