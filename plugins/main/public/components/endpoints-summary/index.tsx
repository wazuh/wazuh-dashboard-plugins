import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiEmptyPrompt,
  EuiProgress,
} from '@elastic/eui';
import { EndpointsSummary } from './endpoints-summary';
import { endpointSummary } from '../../utils/applications';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withGuard,
  withGuardAsync,
  withRouteResolvers,
  withUserAuthorizationPrompt,
} from '../common/hocs';
import { compose } from 'redux';
import { WzButtonPermissions } from '../common/permissions/button';
import { nestedResolve } from '../../services/resolves';
import NavigationService from '../../react-services/navigation-service';
import { getAgentsService } from './services';

async function fetchTotalAgents() {
  const { total_affected_items } = await getAgentsService({
    limit: 1,
  });

  return { totalAgents: total_affected_items };
}

export const MainEndpointsSummary = compose(
  withErrorBoundary,
  withRouteResolvers({ nestedResolve }),
  withGlobalBreadcrumb([{ text: endpointSummary.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    [
      { action: 'agent:read', resource: 'agent:id:*' },
      { action: 'agent:read', resource: 'agent:group:*' },
    ],
  ]),
  withGuardAsync(
    async () => {
      try {
        const response = fetchTotalAgents();

        return {
          ok: false,
          data: response,
        };
      } catch (error) {
        return {
          ok: false,
          data: {},
        };
      }
    },
    () => null,
    () => (
      <EuiPage paddingSize='m'>
        <EuiPageBody>
          <EuiProgress size='xs' color='primary' />
        </EuiPageBody>
      </EuiPage>
    ),
  ),
  withGuard(
    ({ totalAgents }) => totalAgents === 0,
    () => (
      <EuiEmptyPrompt
        iconType='watchesApp'
        title={<h2>No agents were added to the manager</h2>}
        body={<p>Add agents to fleet to start monitoring</p>}
        actions={
          <WzButtonPermissions
            color='primary'
            fill
            permissions={[{ action: 'agent:create', resource: '*:*:*' }]}
            iconType='plusInCircle'
            href={NavigationService.getInstance().getUrlForApp(
              endpointSummary.id,
              {
                path: `#${endpointSummary.redirectTo()}deploy`,
              },
            )}
          >
            Deploy new agent
          </WzButtonPermissions>
        }
      />
    ),
  ),
)(() => {
  return (
    <EuiPage paddingSize='m'>
      <EuiPageBody>
        <EndpointsSummary />
      </EuiPageBody>
    </EuiPage>
  );
});
