import {
  EuiPage,
  EuiPageBody,
  EuiPageContentBody,
  EuiPageSideBar,
  EuiSideNav,
  EuiSideNavItemType,
} from '@elastic/eui';
import React from 'react';

interface LayoutProps {
  'aria-label': string;
  items: EuiSideNavItemType<any>[];
  children: React.ReactChild[] | React.ReactChild;
}

export const Layout = (props: LayoutProps) => (
  <EuiPage>
    <EuiPageSideBar>
      <EuiSideNav
        aria-label={props['aria-label']}
        items={props.items}
      ></EuiSideNav>
    </EuiPageSideBar>
    <EuiPageBody>
      <EuiPageContentBody>{props.children}</EuiPageContentBody>
    </EuiPageBody>
  </EuiPage>
);
