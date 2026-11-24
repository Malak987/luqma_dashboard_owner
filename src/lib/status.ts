import type { CustomerSegment, OrderStatus, PaymentMethod, ProductStatus, RestaurantStatus } from '../data/types';
import type { TranslationKey } from '../i18n/en';

export type BadgeTone =
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'primary'
  | 'accent';

export interface StatusMeta {
  labelKey: TranslationKey;
  tone: BadgeTone;
  color: string;
}

export const orderStatusMeta: Record<OrderStatus, StatusMeta> = {
  pending: {
    labelKey: 'status.pending',
    tone: 'warning',
    color: 'var(--status-pending)',
  },
  preparing: {
    labelKey: 'status.preparing',
    tone: 'info',
    color: 'var(--status-preparing)',
  },
  on_the_way: {
    labelKey: 'status.on_the_way',
    tone: 'accent',
    color: 'var(--status-on-the-way)',
  },
  delivered: {
    labelKey: 'status.delivered',
    tone: 'success',
    color: 'var(--status-delivered)',
  },
  cancelled: {
    labelKey: 'status.cancelled',
    tone: 'danger',
    color: 'var(--status-cancelled)',
  },
};

export const restaurantStatusMeta: Record<RestaurantStatus, StatusMeta> = {
  active: { labelKey: 'status.active', tone: 'success', color: 'var(--status-delivered)' },
  pending: {
    labelKey: 'status.pending_approval',
    tone: 'warning',
    color: 'var(--status-pending)',
  },
  paused: { labelKey: 'status.paused', tone: 'neutral', color: 'var(--inactive)' },
};

export const productStatusMeta: Record<ProductStatus, StatusMeta> = {
  available: { labelKey: 'status.available', tone: 'success', color: 'var(--status-delivered)' },
  low_stock: { labelKey: 'status.low_stock', tone: 'warning', color: 'var(--status-pending)' },
  unavailable: {
    labelKey: 'status.unavailable',
    tone: 'danger',
    color: 'var(--status-cancelled)',
  },
};

export const customerSegmentMeta: Record<CustomerSegment, StatusMeta> = {
  vip: { labelKey: 'status.vip', tone: 'accent', color: 'var(--accent)' },
  new: { labelKey: 'status.new', tone: 'info', color: 'var(--status-preparing)' },
  regular: { labelKey: 'status.regular', tone: 'neutral', color: 'var(--inactive)' },
  at_risk: { labelKey: 'status.at_risk', tone: 'danger', color: 'var(--status-cancelled)' },
};

export const paymentLabelKey: Record<PaymentMethod, TranslationKey> = {
  card: 'payment.card',
  cash: 'payment.cash',
  wallet: 'payment.wallet',
};
