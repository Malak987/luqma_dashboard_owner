import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FolderOpen,
  Layers,
  Plus,
  RefreshCw,
  Tags,
  UtensilsCrossed,
} from 'lucide-react';
import { useToast } from '../../components/feedback/ToastContext';
import { Button } from '../../components/ui/Button';
import { CompactStats } from '../../components/ui/CompactStats';
import { EmptyState, PageHeader, Panel } from '../../components/ui/Panel';
import { Badge, SegmentedControl } from '../../components/ui/Primitives';
import { SearchBox } from '../../components/ui/SearchBox';
import { useI18n } from '../../i18n/context';
import { ApiError } from '../../lib/api/errors';
import { formatNumber } from '../../lib/format';
import { ScopedRequestRunner } from '../../lib/scopedRequest';
import {
  createMenuCategory,
  getMenuCategories,
  setMenuCategoryActive,
  updateMenuCategory,
} from '../menuCategories/api/menuCategory.api';
import type { MenuCategoryData, MenuCategoryInput } from '../menuCategories/api/menuCategory.types';
import { getStoreName } from '../store/domain/store';
import { useStore } from '../store/session/context';
import { CategoryCard } from './CategoryCard';
import { CategoryFormDialog } from './CategoryFormDialog';
import styles from './CategoriesPage.module.css';

type StatusFilter = 'all' | 'active' | 'hidden';
type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Menu categories scoped strictly to the authenticated Owner's trusted Login
 * Store ID. Store ID and Category IDs are kept internal and never displayed.
 * Delete operations are intentionally not exposed.
 */
export default function CategoriesPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { scope, store } = useStore();

  const [categories, setCategories] = useState<MenuCategoryData[]>([]);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState<unknown>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingCategory, setEditingCategory] = useState<MenuCategoryData | null>(null);

  const runnerRef = useRef<ScopedRequestRunner | null>(null);
  if (!runnerRef.current) {
    runnerRef.current = new ScopedRequestRunner();
  }
  const togglingRef = useRef(false);

  const scopeKey = scope ? `${scope.ownerId}:${scope.storeId}` : null;
  const activeScopeKeyRef = useRef<string | null>(scopeKey);
  activeScopeKeyRef.current = scopeKey;

  const loadCategories = useCallback(
    (force = false): Promise<void> => {
      const runner = runnerRef.current!;
      if (!scope) {
        runner.cancel();
        setCategories([]);
        setStatus('idle');
        setError(null);
        return Promise.resolve();
      }

      const expectedScopeKey = `${scope.ownerId}:${scope.storeId}`;
      return runner.run(
        (signal) => getMenuCategories(scope, false, signal),
        {
          onStart: () => {
            setStatus((current) => (current === 'success' ? current : 'loading'));
            setError(null);
          },
          onSuccess: (list) => {
            if (activeScopeKeyRef.current !== expectedScopeKey) {
              return;
            }
            setCategories(list);
            setStatus('success');
          },
          onError: (caught) => {
            if (activeScopeKeyRef.current !== expectedScopeKey) {
              return;
            }
            setCategories([]);
            setError(caught);
            setStatus('error');
          },
        },
        { dedupe: !force },
      );
    },
    [scope],
  );

  useEffect(() => {
    const runner = runnerRef.current!;
    runner.cancel();
    togglingRef.current = false;

    setCategories([]);
    setError(null);
    setSearch('');
    setFilter('all');
    setDialogOpen(false);
    setEditingCategory(null);
    setTogglingId(null);

    if (!scope) {
      setStatus('idle');
      return;
    }

    setStatus('loading');
    void loadCategories(true);

    return () => {
      runner.cancel();
    };
  }, [loadCategories, scope]);

  const activeCount = useMemo(
    () => categories.filter((item) => item.isActive).length,
    [categories],
  );
  const hiddenCount = categories.length - activeCount;
  const totalItemsCount = useMemo(
    () => categories.reduce((sum, item) => sum + item.itemsCount, 0),
    [categories],
  );

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return categories.filter((item) => {
      if (filter === 'active' && !item.isActive) {
        return false;
      }
      if (filter === 'hidden' && item.isActive) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        item.nameAr.toLowerCase().includes(query) || item.nameEn.toLowerCase().includes(query)
      );
    });
  }, [categories, filter, search]);

  const suggestedOrder = useMemo(() => {
    if (categories.length === 0) {
      return 1;
    }
    return Math.max(...categories.map((item) => item.displayOrder)) + 1;
  }, [categories]);

  const openCreate = () => {
    setDialogMode('create');
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const openEdit = (category: MenuCategoryData) => {
    setDialogMode('edit');
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSave = async (input: MenuCategoryInput) => {
    if (!scope) {
      return;
    }

    const requestScopeKey = `${scope.ownerId}:${scope.storeId}`;

    if (dialogMode === 'create') {
      await createMenuCategory(scope, input);
      if (activeScopeKeyRef.current !== requestScopeKey) {
        return;
      }
      toast(t('categories.createSuccess'), 'success');
    } else if (dialogMode === 'edit' && editingCategory) {
      await updateMenuCategory(scope, editingCategory.id, input);
      if (activeScopeKeyRef.current !== requestScopeKey) {
        return;
      }
      toast(t('categories.updateSuccess'), 'success');
    } else {
      return;
    }

    setDialogOpen(false);
    setEditingCategory(null);
    await loadCategories(true);
  };

  const handleToggleActive = async (category: MenuCategoryData, nextActive: boolean) => {
    if (!scope || togglingRef.current || togglingId !== null) {
      return;
    }

    const requestScopeKey = `${scope.ownerId}:${scope.storeId}`;
    togglingRef.current = true;
    setTogglingId(category.id);

    try {
      await setMenuCategoryActive(scope, category.id, nextActive);
      if (activeScopeKeyRef.current !== requestScopeKey) {
        return;
      }
      toast(
        nextActive ? t('categories.toggleSuccessActive') : t('categories.toggleSuccessHidden'),
        'success',
      );
      await loadCategories(true);
    } catch (caught) {
      if (activeScopeKeyRef.current !== requestScopeKey) {
        return;
      }
      const forbidden =
        caught instanceof ApiError &&
        (caught.kind === 'forbidden' || caught.kind === 'ownership-unverified');
      toast(forbidden ? t('categories.forbiddenError') : t('categories.toggleError'), 'error');
    } finally {
      if (activeScopeKeyRef.current === requestScopeKey) {
        togglingRef.current = false;
        setTogglingId(null);
      }
    }
  };

  const storeName = store ? getStoreName(store, locale) : null;
  const isForbiddenError =
    error instanceof ApiError &&
    (error.kind === 'forbidden' || error.kind === 'ownership-unverified');

  return (
    <div>
      <PageHeader
        eyebrow={t('categories.eyebrow')}
        title={t('categories.title')}
        description={t('categories.subtitle')}
        meta={storeName ? <Badge tone="accent">{storeName}</Badge> : undefined}
        actions={
          scope ? (
            <Button
              size="sm"
              icon={<Plus size={15} strokeWidth={2} aria-hidden="true" />}
              onClick={openCreate}
            >
              {t('categories.newCategory')}
            </Button>
          ) : undefined
        }
      />

      {status === 'loading' || status === 'idle' ? (
        <div className={styles.grid} aria-busy="true" aria-label={t('categories.loading')}>
          {[0, 1, 2, 3].map((slot) => (
            <div className={styles.skeletonCard} key={slot}>
              <span className={styles.skeletonTile} />
              <span className={styles.skeletonName} />
              <span className={styles.skeletonMeta} />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <Panel>
          <div className={styles.errorState} role="alert">
            <div className={styles.errorCopy}>
              <span className={styles.errorIcon} aria-hidden="true">
                <AlertTriangle size={18} strokeWidth={1.8} />
              </span>
              <div>
                <h2 className={styles.errorTitle}>{t('categories.loadErrorTitle')}</h2>
                <p className={styles.errorBody}>
                  {isForbiddenError ? t('categories.forbiddenError') : t('categories.loadErrorBody')}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />}
              onClick={() => void loadCategories()}
            >
              {t('common.retry')}
            </Button>
          </div>
        </Panel>
      ) : (
        <>
          <CompactStats
            className={styles.stats}
            items={[
              {
                icon: <Layers size={16} strokeWidth={1.8} />,
                label: t('categories.statTotal'),
                value: formatNumber(categories.length, locale),
                tone: 'primary',
              },
              {
                icon: <CheckCircle2 size={16} strokeWidth={1.8} />,
                label: t('categories.statActive'),
                value: formatNumber(activeCount, locale),
                tone: 'success',
              },
              {
                icon: <UtensilsCrossed size={16} strokeWidth={1.8} />,
                label: t('categories.statItems'),
                value: formatNumber(totalItemsCount, locale),
                tone: 'accent',
              },
            ]}
          />

          {categories.length === 0 ? (
            <Panel>
              <EmptyState
                icon={<FolderOpen size={22} strokeWidth={1.8} aria-hidden="true" />}
                title={t('categories.emptyTitle')}
                body={t('categories.emptyBody')}
                action={
                  scope ? (
                    <Button
                      size="sm"
                      icon={<Plus size={15} strokeWidth={2} aria-hidden="true" />}
                      onClick={openCreate}
                    >
                      {t('categories.newCategory')}
                    </Button>
                  ) : undefined
                }
              />
            </Panel>
          ) : (
            <>
              <div className={styles.toolbar}>
                <SearchBox
                  className={styles.search}
                  value={search}
                  onChange={setSearch}
                  placeholder={t('categories.searchPlaceholder')}
                  ariaLabel={t('categories.searchPlaceholder')}
                />

                <SegmentedControl
                  size="sm"
                  ariaLabel={t('a11y.status')}
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: t('categories.filterAll'), count: categories.length },
                    { value: 'active', label: t('categories.filterActive'), count: activeCount },
                    { value: 'hidden', label: t('categories.filterHidden'), count: hiddenCount },
                  ]}
                />
              </div>

              {filteredCategories.length === 0 ? (
                <Panel>
                  <EmptyState
                    icon={<Tags size={20} strokeWidth={1.8} aria-hidden="true" />}
                    title={t('categories.noMatchesTitle')}
                    body={t('categories.noMatchesBody')}
                  />
                </Panel>
              ) : (
                <div className={styles.grid}>
                  {filteredCategories.map((category, index) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      tone={index}
                      disabled={togglingId !== null}
                      onToggleActive={(item, nextActive) =>
                        void handleToggleActive(item, nextActive)
                      }
                      onEdit={openEdit}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {scope && (
        <CategoryFormDialog
          open={dialogOpen}
          mode={dialogMode}
          category={editingCategory}
          suggestedOrder={suggestedOrder}
          scope={scope}
          onClose={() => {
            setDialogOpen(false);
            setEditingCategory(null);
          }}
          onSubmit={handleSave}
        />
      )}
    </div>
  );
}
