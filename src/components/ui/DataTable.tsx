import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'start' | 'end' | 'center';
  width?: string;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  caption: string;
  onRowClick?: (row: T) => void;
  mobileCard?: (row: T) => ReactNode;
  empty?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  onRowClick,
  mobileCard,
  empty,
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cx(
                    column.align && styles[`align_${column.align}`],
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cx(onRowClick && styles.clickable)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(
                      column.align && styles[`align_${column.align}`],
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileCard && (
        <div className={styles.mobileList}>
          {rows.map((row) => (
            <div className={styles.mobileCard} key={rowKey(row)}>
              {mobileCard(row)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
