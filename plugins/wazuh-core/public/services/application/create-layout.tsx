import { EuiSideNavItemType } from '@elastic/eui';
import React from 'react';
import { Layout } from './layout';

interface LayoutProps {
  label: string;
  items: EuiSideNavItemType<any>[];
}

export const createLayout = (props: LayoutProps) => {
  const NewLayout = ({ children }: { children: React.ReactNode[] }) => (
    <Layout aria-label={props.label} items={props.items}>
      {children}
    </Layout>
  );

  return NewLayout;
};
