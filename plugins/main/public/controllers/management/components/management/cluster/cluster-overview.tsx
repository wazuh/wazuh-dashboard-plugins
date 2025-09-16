import React from 'react';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { cluster } from '../../../../../utils/applications';
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';

export const ClusterOverview = compose(
  withErrorBoundary,
  withGlobalBreadcrumb([{ text: cluster.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    { action: 'cluster:read', resource: 'node:id:*' },
    { action: 'cluster:status', resource: '*:*:*' },
  ]),
)(() => {
  return <ClusterDashboard />;
});
