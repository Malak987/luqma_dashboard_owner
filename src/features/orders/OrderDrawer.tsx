import { Check, Clock3, CreditCard, MapPin, Printer, Store, User } from 'lucide-react';
import type { Order } from '../../data/types';
import { useI18n } from '../../i18n/context';
import { formatCurrency, formatRelativeMinutes, localized } from '../../lib/format';
import { orderStatusMeta, paymentLabelKey } from '../../lib/status';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Primitives';
import { useToast } from '../../components/feedback/ToastContext';
import styles from './OrderDrawer.module.css';

interface OrderDrawerProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDrawer({ order, onClose }: OrderDrawerProps) {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  if (!order) {
    return null;
  }

  const completedSteps: Record<Order['status'], number> = {
    pending: 1,
    preparing: 3,
    on_the_way: 4,
    delivered: 5,
    cancelled: 2,
  };
  const completed = completedSteps[order.status];

  const steps =
    order.status === 'cancelled'
      ? [
          { key: 'orders.placed' as const },
          { key: 'orders.cancelled' as const, danger: true },
        ]
      : [
          { key: 'orders.placed' as const },
          { key: 'orders.confirmed' as const },
          { key: 'orders.preparing' as const },
          { key: 'orders.onTheWay' as const },
          { key: 'orders.delivered' as const },
        ];

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('orders.drawerTitle')}
      description={t('orders.drawerSubtitle')}
      closeLabel={t('dialog.close')}
      placement="end"
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer size={14} strokeWidth={1.8} aria-hidden="true" />}
            onClick={() => toast(t('orders.printToast'))}
          >
            {t('orders.printReceipt')}
          </Button>
          <Button
            size="sm"
            icon={<Check size={14} strokeWidth={2} aria-hidden="true" />}
            onClick={() => toast(t('orders.advanceToast'), 'success')}
          >
            {t('orders.advanceStatus')}
          </Button>
        </>
      }
    >
      <div className={styles.orderHead}>
        <div>
          <p className={styles.orderId}>
            <span className={styles.orderIdLabel}>{t('orders.orderId')}</span>
            <span className="force-ltr">{order.id}</span>
          </p>
          <p className={styles.orderTime}>
            <Clock3 size={12} strokeWidth={1.8} aria-hidden="true" />
            {formatRelativeMinutes(order.minutesAgo, locale)}
          </p>
        </div>
        <StatusBadge meta={orderStatusMeta[order.status]} />
      </div>

      <div className={styles.parties}>
        <div className={styles.party}>
          <span className={styles.partyIcon} aria-hidden="true">
            <User size={15} strokeWidth={1.8} />
          </span>
          <span>
            <span className={styles.partyLabel}>{t('orders.customerDetails')}</span>
            <span className={styles.partyName}>{localized(order.customer, locale)}</span>
          </span>
        </div>
        <div className={styles.party}>
          <span className={styles.partyIcon} aria-hidden="true">
            <Store size={15} strokeWidth={1.8} />
          </span>
          <span>
            <span className={styles.partyLabel}>{t('orders.table.restaurant')}</span>
            <span className={styles.partyName}>{localized(order.restaurant, locale)}</span>
          </span>
        </div>
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('orders.timeline')}</h3>
        <ol className={styles.timeline}>
          {steps.map((step, index) => {
            const done = index < completed;
            const isLast = index === steps.length - 1;
            const timeMinutes =
              completed <= 1
                ? order.minutesAgo
                : Math.max(0, Math.round(order.minutesAgo - (index / (completed - 1)) * order.minutesAgo));
            return (
              <li
                key={step.key}
                className={styles.timelineItem}
                data-done={done || undefined}
                data-current={index === completed - 1 || undefined}
              >
                <span className={styles.timelineMarker} aria-hidden="true">
                  {done ? (
                    <Check size={10} strokeWidth={3} />
                  ) : (
                    <span className={styles.timelineDot} />
                  )}
                </span>
                {!isLast && <span className={styles.timelineLine} aria-hidden="true" />}
                <span className={styles.timelineCopy}>
                  <span className={styles.timelineLabel}>{t(step.key)}</span>
                  {done && (
                    <span className={styles.timelineTime}>
                      {formatRelativeMinutes(timeMinutes, locale)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('orders.itemsLabel')}</h3>
        <ul className={styles.itemList}>
          {order.lines.map((line) => (
            <li className={styles.item} key={`${line.name.en}-${line.unitPrice}`}>
              <span className={styles.itemQty}>{line.quantity}×</span>
              <span className={styles.itemName}>{localized(line.name, locale)}</span>
              <span className={styles.itemPrice}>
                {formatCurrency(line.quantity * line.unitPrice, locale)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>{t('orders.customerDetails')}</h3>
        <div className={styles.detailsGrid}>
          <div className={styles.detailRow}>
            <MapPin size={14} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <span className={styles.detailLabel}>{t('orders.deliveryAddress')}</span>
              <span className={styles.detailValue}>{localized(order.address, locale)}</span>
            </span>
          </div>
          <div className={styles.detailRow}>
            <CreditCard size={14} strokeWidth={1.8} aria-hidden="true" />
            <span>
              <span className={styles.detailLabel}>{t('orders.paymentMethod')}</span>
              <span className={styles.detailValue}>{t(paymentLabelKey[order.payment])}</span>
            </span>
          </div>
        </div>
      </section>

      <section className={styles.summary}>
        <h3 className={styles.sectionTitle}>{t('orders.summary')}</h3>
        <dl className={styles.summaryList}>
          <div>
            <dt>{t('orders.subtotal')}</dt>
            <dd>{formatCurrency(order.subtotal, locale)}</dd>
          </div>
          <div>
            <dt>{t('orders.deliveryFee')}</dt>
            <dd>{formatCurrency(order.deliveryFee, locale)}</dd>
          </div>
          <div>
            <dt>{t('orders.serviceFee')}</dt>
            <dd>{formatCurrency(order.serviceFee, locale)}</dd>
          </div>
          {order.discount > 0 && (
            <div className={styles.discount}>
              <dt>{t('orders.discount')}</dt>
              <dd>−{formatCurrency(order.discount, locale)}</dd>
            </div>
          )}
          <div className={styles.totalRow}>
            <dt>{t('orders.total')}</dt>
            <dd>{formatCurrency(order.total, locale)}</dd>
          </div>
        </dl>
      </section>
    </Dialog>
  );
}
