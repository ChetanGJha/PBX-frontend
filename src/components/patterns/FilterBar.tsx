import React from 'react';
import { SearchInput } from './Patterns';

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = '',
  onSearchChange = () => {},
  searchPlaceholder = 'Search records...',
  filters,
  actions,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
        {(searchValue !== undefined || !filters) && (
          <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
        )}
        {filters}
      </div>

      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{actions}</div>}
    </div>
  );
};
