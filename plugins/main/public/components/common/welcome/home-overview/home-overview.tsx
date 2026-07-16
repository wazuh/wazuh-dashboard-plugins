import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiButtonEmpty,
  EuiSpacer,
} from '@elastic/eui';
import { RefreshProvider, useRefresh } from './context/refresh-context';
import { OverviewSection } from './components/overview-section';

const HomeOverviewHeader: React.FC = () => {
  const { refresh } = useRefresh();
  return (
    <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
      <EuiFlexItem>
        <EuiTitle size='s'>
          <h1>Overview</h1>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonEmpty
          iconType='refresh'
          onClick={refresh}
          data-test-subj='home-overview-refresh'
        >
          Refresh
        </EuiButtonEmpty>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

/**
 * The Home overview landing page: a live security dashboard that replaces the
 * static module catalog. This ticket delivers the shell + the OVERVIEW section;
 * later tickets add the remaining sections.
 */
export const HomeOverview: React.FC = () => (
  <RefreshProvider>
    <EuiPage paddingSize='l'>
      <EuiPageBody>
        <HomeOverviewHeader />
        <EuiSpacer size='m' />
        <OverviewSection />
      </EuiPageBody>
    </EuiPage>
  </RefreshProvider>
);
