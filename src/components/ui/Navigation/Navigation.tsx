import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../Button/Button';

export interface TabItem {
  id: string;
  label: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'line' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeTab,
  onChange,
  variant = 'line',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: variant === 'line' ? '24px' : '8px',
        borderBottom: variant === 'line' ? '1px solid var(--pbx-border-default)' : 'none',
        marginBottom: '20px',
      }}
    >
      {items.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? 'var(--pbx-action-primary)' : 'var(--pbx-text-secondary)',
              padding: variant === 'line' ? '12px 0' : '6px 14px',
              backgroundColor: variant === 'pills' && isActive ? 'var(--pbx-color-primary-100)' : 'transparent',
              borderRadius: variant === 'pills' ? 'var(--pbx-radius-full)' : '0',
              border: 'none',
              borderBottom: variant === 'line' && isActive ? '2px solid var(--pbx-action-primary)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
};

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={14} style={{ color: 'var(--pbx-text-muted)' }} />}
            {isLast ? (
              <span style={{ fontWeight: 600, color: 'var(--pbx-text-primary)' }}>{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--pbx-text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 500,
                }}
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px' }}>
      <span style={{ fontSize: '12px', color: 'var(--pbx-text-secondary)' }}>
        Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft size={14} />}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight size={14} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
