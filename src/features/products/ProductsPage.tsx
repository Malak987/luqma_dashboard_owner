import { useDeferredValue, useMemo, useState } from 'react';
import { Boxes, CheckCircle2, Pencil, Plus, SearchX, TriangleAlert } from 'lucide-react';
import { products } from '../../data/mock';
import type { Product, ProductStatus } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { useToast } from '../../components/feedback/ToastContext';
import { formatCurrency, formatNumber, localized } from '../../lib/format';
import { productStatusMeta } from '../../lib/status';
import { categoryIconMap } from '../../lib/categoryIcons';
import { Avatar, SegmentedControl, StatusBadge } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { CompactStats } from '../../components/ui/CompactStats';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { EmptyState, PageHeader, Panel } from '../../components/ui/Panel';
import { Pagination } from '../../components/ui/Pagination';
import { SearchBox } from '../../components/ui/SearchBox';
import { Select } from '../../components/ui/Field';
import styles from './ProductsPage.module.css';

type StatusFilter = ProductStatus | 'all';
const PAGE_SIZE = 6;

export default function ProductsPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(
    () => ({
      all: products.length,
      available: products.filter((product) => product.status === 'available').length,
      low_stock: products.filter((product) => product.status === 'low_stock').length,
      unavailable: products.filter((product) => product.status === 'unavailable').length,
    }),
    [],
  );

  const categoryOptions = useMemo(() => {
    const unique = new Map<string, string>();
    products.forEach((product) => {
      unique.set(product.category.en, localized(product.category, locale));
    });
    return [
      { value: 'all', label: t('products.categoryAll') },
      ...Array.from(unique, ([value, label]) => ({ value, label })),
    ];
  }, [locale, t]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    return products.filter((product) => {
      if (status !== 'all' && product.status !== status) {
        return false;
      }
      if (category !== 'all' && product.category.en !== category) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [
        product.name.en,
        product.name.ar,
        product.category.en,
        product.category.ar,
        product.restaurant.en,
        product.restaurant.ar,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [category, deferredSearch, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = Math.min(safePage * PAGE_SIZE, filtered.length);

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: t('products.table.product'),
      render: (product) => {
        const Icon = categoryIconMap[product.icon];
        return (
          <div className={styles.productCell}>
            <span className={styles.iconTile} aria-hidden="true">
              <Icon size={16} strokeWidth={1.7} />
            </span>
            <span className={styles.productName}>{localized(product.name, locale)}</span>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: t('products.table.category'),
      render: (product) => localized(product.category, locale),
    },
    {
      key: 'restaurant',
      header: t('products.table.restaurant'),
      render: (product) => (
        <div className={styles.restaurantCell}>
          <Avatar name={localized(product.restaurant, locale)} tone={0} size="sm" />
          <span>{localized(product.restaurant, locale)}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: t('products.table.price'),
      align: 'end',
      render: (product) => <span className={styles.price}>{formatCurrency(product.price, locale)}</span>,
    },
    {
      key: 'orders',
      header: t('products.table.orders'),
      align: 'center',
      render: (product) => <span className={styles.orders}>{formatNumber(product.orders, locale)}</span>,
    },
    {
      key: 'status',
      header: t('products.table.status'),
      render: (product) => <StatusBadge meta={productStatusMeta[product.status]} />,
    },
    {
      key: 'action',
      header: t('products.table.action'),
      align: 'end',
      render: () => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toast(t('products.editToast'))}
          icon={<Pencil size={13} strokeWidth={1.8} aria-hidden="true" />}
        >
          {t('common.edit')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t('products.eyebrow')}
        title={t('products.title')}
        description={t('products.subtitle')}
        actions={
          <Button
            icon={<Plus size={16} strokeWidth={2} aria-hidden="true" />}
            onClick={() => toast(t('products.addToast'))}
          >
            {t('products.addProduct')}
          </Button>
        }
      />

      <CompactStats
        items={[
          {
            icon: <Boxes size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('products.title'),
            value: formatNumber(products.length, locale),
          },
          {
            icon: <CheckCircle2 size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('products.statusAvailable'),
            value: formatNumber(counts.available, locale),
            tone: 'success',
          },
          {
            icon: <TriangleAlert size={17} strokeWidth={1.8} aria-hidden="true" />,
            label: t('products.statusLow'),
            value: formatNumber(counts.low_stock, locale),
            tone: 'warning',
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
          placeholder={t('products.searchPlaceholder')}
          ariaLabel={t('a11y.search')}
        />
        <Select
          hideLabel
          label={t('products.table.category')}
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          options={categoryOptions}
          containerClassName={styles.select}
        />
        <SegmentedControl
          ariaLabel={t('products.table.status')}
          value={status}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            { value: 'all', label: t('products.statusAll'), count: counts.all },
            { value: 'available', label: t('products.statusAvailable'), count: counts.available },
            { value: 'low_stock', label: t('products.statusLow'), count: counts.low_stock },
            { value: 'unavailable', label: t('products.statusUnavailable'), count: counts.unavailable },
          ]}
        />
      </div>

      <Panel padded={false} className={styles.tableCard}>
        <DataTable
          columns={columns}
          rows={visible}
          rowKey={(product) => product.id}
          caption={t('products.title')}
          empty={
            <EmptyState
              icon={<SearchX size={22} strokeWidth={1.8} aria-hidden="true" />}
              title={t('products.noResultsTitle')}
              body={t('products.noResultsBody')}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setCategory('all');
                    setStatus('all');
                  }}
                >
                  {t('orders.clearFilters')}
                </Button>
              }
            />
          }
          mobileCard={(product) => {
            const Icon = categoryIconMap[product.icon];
            return (
              <div className={styles.mobileProduct}>
                <div className={styles.mobileTop}>
                  <div className={styles.productCell}>
                    <span className={styles.iconTile} aria-hidden="true">
                      <Icon size={16} strokeWidth={1.7} />
                    </span>
                    <div>
                      <span className={styles.productName}>{localized(product.name, locale)}</span>
                      <span className={styles.mobileCategory}>
                        {localized(product.category, locale)}
                      </span>
                    </div>
                  </div>
                  <StatusBadge meta={productStatusMeta[product.status]} />
                </div>
                <div className={styles.mobileMeta}>
                  <span>{localized(product.restaurant, locale)}</span>
                  <span className={styles.price}>{formatCurrency(product.price, locale)}</span>
                  <span className={styles.orders}>
                    {formatNumber(product.orders, locale)} {t('restaurants.orders')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast(t('products.editToast'))}
                  icon={<Pencil size={13} strokeWidth={1.8} aria-hidden="true" />}
                >
                  {t('common.edit')}
                </Button>
              </div>
            );
          }}
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
