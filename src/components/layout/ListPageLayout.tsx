import React from 'react';
import { PageContainer } from './PageContainer';
import { Stack } from './Stack';
import { Card } from '../ui/Card/Card';

export interface ListPageLayoutProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  filterBar?: React.ReactNode;
  children: React.ReactNode;
  alert?: React.ReactNode;
}

export const ListPageLayout: React.FC<ListPageLayoutProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  filterBar,
  children,
  alert,
}) => {
  return (
    <PageContainer title={title} subtitle={subtitle} eyebrow={eyebrow} actions={actions}>
      <Stack gap="6">
        {alert}

        {filterBar && <Card padding="sm">{filterBar}</Card>}

        <Card padding="sm">{children}</Card>
      </Stack>
    </PageContainer>
  );
};
