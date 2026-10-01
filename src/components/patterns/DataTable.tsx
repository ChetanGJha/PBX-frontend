import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, SortableHeader } from '../ui/Table/Table';
import { Spinner } from '../ui/Feedback/Feedback';
import { EmptyState } from '../ui/Feedback/Feedback';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  pagination?: React.ReactNode;
  density?: 'compact' | 'comfortable';
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription,
  sortKey,
  sortOrder,
  onSort,
  pagination,
  density = 'comfortable',
  actions,
}: DataTableProps<T>) {
  return (
    <div>
      <Table density={density}>
        <TableHeader>
          <TableRow>
            {columns.map((col) =>
              col.sortable ? (
                <SortableHeader
                  key={col.key}
                  sortKey={col.key}
                  currentSortKey={sortKey}
                  sortOrder={sortOrder}
                  onSort={onSort}
                  style={{ width: col.width }}
                >
                  {col.header}
                </SortableHeader>
              ) : (
                <TableCell key={col.key} header style={{ width: col.width }}>
                  {col.header}
                </TableCell>
              )
            )}
            {actions && <TableCell header style={{ width: '100px', textAlign: 'right' }}>Actions</TableCell>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Spinner size={20} />
                  <span>Loading data...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell style={{ textAlign: 'right' }}>
                    {actions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination}
    </div>
  );
}
