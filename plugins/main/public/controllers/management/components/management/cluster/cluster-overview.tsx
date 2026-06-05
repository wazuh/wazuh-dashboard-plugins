import React from 'react';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { serverStatus } from '../../../../../utils/applications';
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';

export const ClusterOverview = compose(
  withErrorBoundary,
  withGlobalBreadcrumb([{ text: serverStatus.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    { action: 'cluster:read', resource: 'node:id:*' },
  ]),
)(() => {
  return <ClusterDashboard />;
});
