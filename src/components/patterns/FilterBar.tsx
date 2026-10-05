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
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  actions,
}) => {
  const showSearch = searchValue !== undefined && onSearchChange !== undefined;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '1 1 auto',
          flexWrap: 'wrap',
          minWidth: 0,
        }}
      >
        {showSearch && (
          <div style={{ flex: '1 1 240px', maxWidth: '320px', minWidth: '200px' }}>
            <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
          </div>
        )}
        {filters && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {filters}
          </div>
        )}
      </div>

      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>{actions}</div>}
    </div>
  );
};
