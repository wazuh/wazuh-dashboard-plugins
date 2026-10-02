import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import globalBreadcrumbReducers from '../../../redux/reducers/globalBreadcrumbReducers';
import { useGlobalBreadcrumb } from '../../common/hooks/useGlobalBreadcrumb';
import { AgentView } from '.';

let mockTab = 'welcome';

jest.mock('../../common/hocs', () => ({
  withErrorBoundary: (Component: React.FC) => Component,
  withRouteResolvers: () => (Component: React.FC) => Component,
  withGlobalBreadcrumb: jest.requireActual(
    '../../common/hocs/withGlobalBreadcrumb',
  ).withGlobalBreadcrumb,
  withGuard: jest.requireActual('../../common/hocs/withGuard').withGuard,
  __esModule: true,
}));

jest.mock('../../common/hocs/withAgentSync', () => ({
  withAgentSync: (Component: React.FC) => Component,
}));

jest.mock('../../../services/resolves', () => ({
  nestedResolve: jest.fn(),
}));

jest.mock('../../common/hooks', () => ({
  useEffectEnsureComponentMounted: jest.fn(),
}));

jest.mock('../../common/hooks/use-router-search', () => ({
  useRouterSearch: () => ({ tab: mockTab }),
}));

jest.mock('../../router-search', () => ({
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ path, children }: { path: string; children: React.ReactNode }) =>
    path === `?tab=${mockTab}` ? <>{children}</> : null,
  Redirect: () => null,
}));

jest.mock('../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getUrlForApp: () => 'endpoints-summary-url',
      navigate: jest.fn(),
    }),
  },
}));

jest.mock('../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn().mockImplementation(() => ({
    pinAgent: jest.fn(),
    syncPinnedAgentSources: jest.fn(),
  })),
}));

jest.mock(
  '../../../../../../src/plugins/opensearch_dashboards_react/public',
  () => ({
    RedirectAppLinks: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }),
);

jest.mock('../../../kibana-services', () => ({
  getCore: () => ({ application: {} }),
}));

jest.mock('../../../utils/applications', () => ({
  endpointSummary: {
    id: 'endpoints-summary',
    breadcrumbLabel: 'Summary',
  },
}));

jest.mock('../../agents/prompts', () => ({
  PromptNoSelectedAgent: () => <div data-test-subj='no-selected-agent' />,
}));

jest.mock('../../common/modules/main-agent', () => ({
  MainModuleAgent: () => null,
}));

// The agent views set their own breadcrumb, the way the real ones do.
function mockAgentViewBreadcrumb(text: string) {
  return ({ agent }: { agent: { id: string; name: string } }) => {
    useGlobalBreadcrumb([{ text: 'Summary' }, { agent }, { text }]);
    return null;
  };
}

jest.mock('../../common/welcome/agents-welcome', () => ({
  AgentsWelcome: mockAgentViewBreadcrumb('Welcome'),
}));

jest.mock('../../agents/stats', () => ({
  MainAgentStats: mockAgentViewBreadcrumb('Stats'),
}));

jest.mock(
  '../../../controllers/management/components/management/configuration/configuration-main.js',
  () => ({
    __esModule: true,
    default: mockAgentViewBreadcrumb('Configuration'),
  }),
);

const agent = { id: '001', name: 'wazuh.agent.deb.local' };

const renderAgentView = (currentAgentData: object) => {
  const store = createStore(
    combineReducers({
      globalBreadcrumbReducers,
      appStateReducers: () => ({ currentAgentData }),
    }),
  );
  render(
    <Provider store={store}>
      <AgentView />
    </Provider>,
  );
  return store.getState().globalBreadcrumbReducers.breadcrumb;
};

describe('AgentView breadcrumb', () => {
  it.each([
    ['welcome', 'Welcome'],
    ['stats', 'Stats'],
    ['configuration', 'Configuration'],
  ])('keeps the agent in the breadcrumb of the %s tab', (tab, text) => {
    mockTab = tab;

    expect(renderAgentView(agent)).toEqual([
      { text: 'Summary' },
      { agent },
      { text },
    ]);
  });

  it('only shows the Endpoint summary breadcrumb when no agent is selected', () => {
    mockTab = 'welcome';

    expect(renderAgentView({})).toEqual([
      { text: 'Summary', href: 'endpoints-summary-url' },
    ]);
  });
});
