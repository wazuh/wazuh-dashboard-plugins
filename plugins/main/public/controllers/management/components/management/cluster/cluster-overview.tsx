import React from 'react';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withGuardAsync,
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { cluster } from '../../../../../utils/applications';
import { WzRequest } from '../../../../../react-services';
import { ClusterDisabled } from '../../../../../components/management/cluster/cluster-disabled';
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';
import { LoadingSearchbarProgress } from '../../../../../components/common/loading-searchbar-progress/loading-searchbar-progress';
import { FormattedMessage } from '@osd/i18n/react';

interface ClusterOverviewState {
  isClusterEnabled: boolean;
  isClusterRunning: boolean;
  statusRunning: string;
}

const checkClusterIsEnabledAndRunning = async () => {
  try {
    const status: any = await WzRequest.apiReq('GET', '/cluster/status', {});
    const clusterEnabled = status?.data?.data?.enabled;
    const isClusterEnabled = clusterEnabled === 'yes';
    const statusRunning = status?.data?.data?.running;
    const isClusterRunning = statusRunning === 'yes';
    return {
      ok: !(isClusterEnabled && isClusterRunning),
      data: {
        isClusterEnabled,
        isClusterRunning,
        statusRunning,
      },
    };
  } catch (error) {
    return {
      ok: true,
      data: {
        error: { title: 'There was a problem', message: error.message },
      },
    };
  }
};

export const ClusterOverview = compose(
  withErrorBoundary,
  withGlobalBreadcrumb([{ text: cluster.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    { action: 'cluster:status', resource: '*:*:*' },
  ]),
  withGuardAsync(
    checkClusterIsEnabledAndRunning,
    ({ isClusterEnabled, isClusterRunning, error }) => (
      <ClusterDisabled
        error={error}
        enabled={isClusterEnabled}
        running={isClusterRunning}
      />
    ),
    () => (
      <LoadingSearchbarProgress
        message={
          <FormattedMessage
            id='module.cluster.checking'
            defaultMessage='Checking if cluster is enabled and running...'
          />
        }
      />
    ),
  ),
)(
  ({
    isClusterEnabled,
    isClusterRunning,
    statusRunning,
  }: ClusterOverviewState) => {
    return (
      <>
        {isClusterEnabled && isClusterRunning ? (
          <ClusterDashboard statusRunning={statusRunning} />
        ) : null}
      </>
    );
  },
);
