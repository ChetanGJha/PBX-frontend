import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  density?: 'compact' | 'comfortable';
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({
  density = 'comfortable',
  children,
  style,
  className = '',
  ...props
}) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: 'var(--pbx-radius-lg)', border: '1px solid var(--pbx-border-default)' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'var(--pbx-bg-surface)',
          fontSize: '13px',
          textAlign: 'left',
          ...style,
        }}
        className={`table-density-${density} ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <thead style={{ backgroundColor: 'var(--pbx-bg-subtle)', borderBottom: '1px solid var(--pbx-border-default)' }} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, ...props }) => (
  <tbody {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, style, ...props }) => (
  <tr
    style={{
      borderBottom: '1px solid var(--pbx-border-subtle)',
      transition: 'background-color 0.15s ease',
      ...style,
    }}
    {...props}
  >
    {children}
  </tr>
);

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  header?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  header = false,
  children,
  style,
  ...props
}) => {
  const Component = header ? 'th' : 'td';
  return (
    <Component
      style={{
        padding: '12px 16px',
        color: header ? 'var(--pbx-text-secondary)' : 'var(--pbx-text-primary)',
        fontWeight: header ? 700 : 400,
        fontSize: header ? '11px' : '13px',
        textTransform: header ? 'uppercase' : 'none',
        letterSpacing: header ? '0.04em' : 'normal',
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export interface SortableHeaderProps extends TableCellProps {
  sortKey: string;
  currentSortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  children: React.ReactNode;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  sortKey,
  currentSortKey,
  sortOrder,
  onSort,
  children,
  style,
  ...props
}) => {
  const isSorted = currentSortKey === sortKey;

  return (
    <TableCell
      header
      style={{ cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => onSort && onSort(sortKey)}
      {...props}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span>{children}</span>
        {isSorted ? (
          sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        ) : (
          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
        )}
      </div>
    </TableCell>
  );
};
