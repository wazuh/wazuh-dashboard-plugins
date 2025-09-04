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
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';
import { LoadingSearchbarProgress } from '../../../../../components/common/loading-searchbar-progress/loading-searchbar-progress';
import { FormattedMessage } from '@osd/i18n/react';

interface ClusterOverviewState {
  clusterEnabled: boolean;
  isClusterRunning: boolean;
  statusRunning: string;
}

const getClusterStatus = async () => {
  try {
    const status: any = await WzRequest.apiReq('GET', '/cluster/status', {});
    const statusRunning = status?.data?.data?.running;
    return {
      ok: false,
      data: {
        clusterEnabled: 'yes', // Always enabled in v5.0+ (cluster by default)
        isClusterRunning: true, // Always running in v5.0+ (cluster by default)
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
    getClusterStatus,
    ({ clusterEnabled, isClusterRunning, error }) => null,
    () => (
      <LoadingSearchbarProgress
        message={
          <FormattedMessage
            id='module.cluster.loading'
            defaultMessage='Loading cluster information...'
          />
        }
      />
    ),
  ),
)(
  ({
    clusterEnabled,
    isClusterRunning,
    statusRunning,
  }: ClusterOverviewState) => {
    return (
      <>
        <ClusterDashboard statusRunning={statusRunning} />
      </>
    );
  },
);
