import { useEffect, useState } from 'react';
import { Pencil, Tags } from 'lucide-react';
import { IconButton } from '../../components/ui/IconButton';
import { Badge, Switch } from '../../components/ui/Primitives';
import { useI18n } from '../../i18n/context';
import { resolveAssetUrl } from '../../lib/api/media';
import { formatNumber } from '../../lib/format';
import type { MenuCategoryData } from '../menuCategories/api/menuCategory.types';
import styles from './CategoriesPage.module.css';

function CategoryTileImage({
  name,
  imageUrl,
  tone,
}: {
  name: string;
  imageUrl: string | null;
  tone: number;
}) {
  const resolved = resolveAssetUrl(imageUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (resolved && !failed) {
    return (
      <span className={styles.imageTile}>
        <img
          src={resolved}
          alt={name}
          className={styles.categoryImage}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={styles.iconTile} data-tone={tone % 4} aria-hidden="true">
      <Tags size={18} strokeWidth={1.8} />
    </span>
  );
}

interface CategoryCardProps {
  category: MenuCategoryData;
  tone: number;
  disabled: boolean;
  onToggleActive: (category: MenuCategoryData, nextActive: boolean) => void;
  onEdit: (category: MenuCategoryData) => void;
}

/**
 * Displays only customer-facing menu category fields (names, image, active
 * status, display order, and item count). Internal Category ID and Store ID
 * are never rendered, and delete controls are deliberately omitted.
 */
export function CategoryCard({
  category,
  tone,
  disabled,
  onToggleActive,
  onEdit,
}: CategoryCardProps) {
  const { t, locale } = useI18n();
  const primaryName =
    locale === 'ar'
      ? category.nameAr || category.nameEn
      : category.nameEn || category.nameAr;
  const secondaryName = locale === 'ar' ? category.nameEn : category.nameAr;

  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <CategoryTileImage name={primaryName} imageUrl={category.imageUrl} tone={tone} />
        <Badge tone={category.isActive ? 'success' : 'neutral'} dot>
          {category.isActive ? t('categories.statusActive') : t('categories.statusHidden')}
        </Badge>
      </div>

      <h2 className={styles.name} dir="auto">
        {primaryName}
      </h2>
      {secondaryName && secondaryName !== primaryName && (
        <p className={styles.secondaryName} dir="auto">
          {secondaryName}
        </p>
      )}

      <div className={styles.metaRow}>
        <span className={styles.items}>
          {t('categories.itemsCount', {
            count: formatNumber(category.itemsCount, locale),
          })}
        </span>
        <span className={styles.orderTag}>
          {t('categories.displayOrder', {
            order: formatNumber(category.displayOrder, locale),
          })}
        </span>
      </div>

      <div className={styles.cardFooter}>
        <Switch
          checked={category.isActive}
          disabled={disabled}
          label={t('categories.toggleAria', { name: primaryName })}
          onChange={(nextActive) => onToggleActive(category, nextActive)}
        />
        <div className={styles.actions}>
          <IconButton
            label={t('categories.edit')}
            size="sm"
            disabled={disabled}
            onClick={() => onEdit(category)}
          >
            <Pencil size={14} strokeWidth={1.8} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </article>
  );
}
