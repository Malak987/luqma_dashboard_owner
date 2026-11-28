import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { useToast } from '../../components/feedback/ToastContext';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Field';
import { Switch } from '../../components/ui/Primitives';
import { useI18n } from '../../i18n/context';
import { ApiError } from '../../lib/api/errors';
import { resolveAssetUrl } from '../../lib/api/media';
import { uploadMenuCategoryIcon } from '../menuCategories/api/menuCategory.api';
import type { MenuCategoryData, MenuCategoryInput } from '../menuCategories/api/menuCategory.types';
import type { OwnerStoreScope } from '../store/domain/ownership';
import styles from './CategoryFormDialog.module.css';

interface CategoryFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  category: MenuCategoryData | null;
  suggestedOrder: number;
  scope: OwnerStoreScope;
  onClose: () => void;
  onSubmit: (input: MenuCategoryInput) => Promise<void>;
}

interface FormErrors {
  nameAr?: string;
  nameEn?: string;
  displayOrder?: string;
}

export function CategoryFormDialog({
  open,
  mode,
  category,
  suggestedOrder,
  scope,
  onClose,
  onSubmit,
}: CategoryFormDialogProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const submittingRef = useRef(false);
  const uploadControllerRef = useRef<AbortController | null>(null);
  const uploadVersionRef = useRef(0);

  useEffect(() => {
    uploadVersionRef.current += 1;
    uploadControllerRef.current?.abort();
    uploadControllerRef.current = null;
    submittingRef.current = false;

    if (!open) {
      return;
    }

    if (mode === 'edit' && category) {
      setNameAr(category.nameAr);
      setNameEn(category.nameEn);
      setDisplayOrder(String(category.displayOrder));
      setIsActive(category.isActive);
      setImageUrl(category.imageUrl ?? '');
    } else {
      setNameAr('');
      setNameEn('');
      setDisplayOrder(String(Math.max(0, suggestedOrder)));
      setIsActive(true);
      setImageUrl('');
    }

    setPreviewFailed(false);
    setErrors({});
    setSubmitError(null);
    setUploadError(null);
    setUploading(false);
    setSaving(false);

    return () => {
      uploadVersionRef.current += 1;
      uploadControllerRef.current?.abort();
      uploadControllerRef.current = null;
    };
  }, [category, mode, open, scope.storeId, suggestedOrder]);

  const resolvedPreview = resolveAssetUrl(imageUrl);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || uploading || submittingRef.current) {
      return;
    }

    uploadControllerRef.current?.abort();
    const controller = new AbortController();
    uploadControllerRef.current = controller;
    const version = ++uploadVersionRef.current;

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedPath = await uploadMenuCategoryIcon(scope, file, controller.signal);
      if (controller.signal.aborted || uploadVersionRef.current !== version) {
        return;
      }
      if (uploadedPath) {
        setImageUrl(uploadedPath);
        setPreviewFailed(false);
        toast(t('categories.uploadSuccess'), 'success');
      } else {
        toast(t('categories.uploadSuccessNoPath'), 'info');
      }
    } catch (caught) {
      if (controller.signal.aborted || uploadVersionRef.current !== version) {
        return;
      }
      const forbidden =
        caught instanceof ApiError &&
        (caught.kind === 'forbidden' || caught.kind === 'ownership-unverified');
      setUploadError(forbidden ? t('categories.forbiddenError') : t('categories.uploadError'));
    } finally {
      if (uploadControllerRef.current === controller) {
        uploadControllerRef.current = null;
      }
      if (uploadVersionRef.current === version) {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || saving || uploading) {
      return;
    }

    const nextErrors: FormErrors = {};
    if (!nameAr.trim()) {
      nextErrors.nameAr = t('categories.invalidNameAr');
    }
    if (!nameEn.trim()) {
      nextErrors.nameEn = t('categories.invalidNameEn');
    }

    const trimmedOrder = displayOrder.trim();
    const parsedOrder = Number(trimmedOrder);
    if (trimmedOrder === '' || !Number.isInteger(parsedOrder) || parsedOrder < 0) {
      nextErrors.displayOrder = t('categories.invalidOrder');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setSubmitError(null);

    try {
      await onSubmit({
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        imageUrl,
        displayOrder: parsedOrder,
        isActive,
      });
    } catch (caught) {
      const forbidden =
        caught instanceof ApiError &&
        (caught.kind === 'forbidden' || caught.kind === 'ownership-unverified');
      setSubmitError(forbidden ? t('categories.forbiddenError') : t('categories.saveError'));
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  const title = mode === 'create' ? t('categories.createTitle') : t('categories.editTitle');
  const subtitle = mode === 'create' ? t('categories.createSubtitle') : t('categories.editSubtitle');

  return (
    <Dialog
      open={open}
      onClose={saving || uploading ? () => undefined : onClose}
      title={title}
      description={subtitle}
      size="md"
      closeLabel={t('dialog.close')}
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={saving || uploading}
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            form="menu-category-form"
            size="sm"
            loading={saving}
            disabled={uploading}
          >
            {saving
              ? t('categories.saving')
              : mode === 'create'
                ? t('categories.createSubmit')
                : t('categories.updateSubmit')}
          </Button>
        </>
      }
    >
      <form id="menu-category-form" className={styles.form} onSubmit={handleSubmit} noValidate>
        {submitError && (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        )}

        <div className={styles.grid}>
          <Input
            label={t('categories.nameAr')}
            placeholder={t('categories.nameArPlaceholder')}
            value={nameAr}
            onChange={(event) => {
              setNameAr(event.target.value);
              setSubmitError(null);
              if (errors.nameAr) {
                setErrors((current) => ({ ...current, nameAr: undefined }));
              }
            }}
            error={errors.nameAr}
            dir="rtl"
            required
          />

          <Input
            label={t('categories.nameEn')}
            placeholder={t('categories.nameEnPlaceholder')}
            value={nameEn}
            onChange={(event) => {
              setNameEn(event.target.value);
              setSubmitError(null);
              if (errors.nameEn) {
                setErrors((current) => ({ ...current, nameEn: undefined }));
              }
            }}
            error={errors.nameEn}
            dir="ltr"
            required
          />
        </div>

        <Input
          label={t('categories.orderLabel')}
          hint={t('categories.orderHint')}
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={displayOrder}
          onChange={(event) => {
            setDisplayOrder(event.target.value);
            setSubmitError(null);
            if (errors.displayOrder) {
              setErrors((current) => ({ ...current, displayOrder: undefined }));
            }
          }}
          error={errors.displayOrder}
          dir="ltr"
          required
        />

        <div className={styles.imageSection}>
          <p className={styles.sectionLabel}>{t('categories.imageLabel')}</p>
          <div className={styles.imageRow}>
            <div className={styles.previewBox}>
              {resolvedPreview && !previewFailed ? (
                <img
                  src={resolvedPreview}
                  alt={nameEn || nameAr || t('categories.imageLabel')}
                  className={styles.previewImage}
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <ImageIcon size={20} strokeWidth={1.7} aria-hidden="true" />
              )}
            </div>

            <div className={styles.imageActions}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={(event) => void handleFileChange(event)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                loading={uploading}
                disabled={saving}
                icon={<Upload size={14} strokeWidth={1.8} aria-hidden="true" />}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? t('categories.uploadingImage') : t('categories.uploadImage')}
              </Button>
              {!resolvedPreview && <p className={styles.imageHint}>{t('categories.noImage')}</p>}
            </div>
          </div>

          {uploadError && (
            <p className={styles.uploadError} role="alert">
              {uploadError}
            </p>
          )}
        </div>

        <div className={styles.switchRow}>
          <div>
            <p className={styles.switchTitle}>{t('categories.activeLabel')}</p>
            <p className={styles.switchHint}>{t('categories.activeHint')}</p>
          </div>
          <Switch
            checked={isActive}
            label={t('categories.activeLabel')}
            disabled={saving}
            onChange={setIsActive}
          />
        </div>
      </form>
    </Dialog>
  );
}
