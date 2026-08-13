import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WzConfigurationSwitch from './configuration-switch';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';
import { CSS } from '../../../../../../test/utils/CSS';
import { getAgentReportedConfiguration } from './utils/agent-config-service';

jest.mock('react-redux', () => ({
  connect: () => Component => Component,
  // The prompt for an agent that never reported opens the agent selector.
  useDispatch: () => jest.fn(),
  __esModule: true,
}));

jest.mock('redux', () => ({
  compose: () => Component => Component,
  __esModule: true,
}));

jest.mock('./configuration-overview.js', () => () => <></>);

jest.mock('./utils/agent-config-service', () => ({
  getAgentReportedConfiguration: jest.fn(),
  clearAgentReportedConfigurationCache: jest.fn(),
}));

jest.mock('./global-configuration/global-configuration', () => ({
  WzConfigurationGlobalConfigurationManager: () => <></>,
  WzConfigurationGlobalConfigurationAgent: () => <></>,
  __esModule: true,
}));

jest.mock('./edit-configuration/edit-configuration', () => () => <></>);

jest.mock('./registration-service/registration-service', () => () => <></>);

jest.mock('./cluster/cluster', () => () => <></>);

jest.mock('./client/client', () => () => <></>);

jest.mock('./alerts/alerts-labels', () => ({
  WzConfigurationAlertsLabelsAgent: () => <></>,
  __esModule: true,
}));

jest.mock('./policy-monitoring/policy-monitoring', () => () => <></>);

jest.mock('./vulnerabilities/vulnerabilities', () => () => <></>);

jest.mock('./inventory/inventory', () => () => <></>);

jest.mock('./active-response/active-response-agent', () => () => <></>);

jest.mock('./commands/commands', () => () => <></>);

jest.mock('./log-collection/log-collection', () => () => <></>);

jest.mock('./integrity-monitoring/integrity-monitoring', () => () => <></>);

jest.mock('./util-components/view-selector', () => ({
  default: () => <></>,
  WzViewSelectorSwitch: () => <></>,
  __esModule: true,
}));

jest.mock('./util-components/loading', () => () => <></>);

jest.mock('./util-hocs/render-if', () => ({
  withRenderIfOrWrapped: () => <></>,
  __esModule: true,
}));

jest.mock('./util-components/configuration-path', () => () => <></>);

jest.mock('./util-components/refresh-cluster-info-button', () => () => <></>);

jest.mock('../../../../../components/agents/prompts', () => ({
  PromptNoActiveAgentWithoutSelect: () => <></>,
  __esModule: true,
}));

jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_, opts) => opts.defaultMessage,
  },
  __esModule: true,
}));

jest.mock('../../../../../utils/applications', () => ({
  id: '001',
  __esModule: true,
}));

jest.mock('../../../../../react-services/navigation-service', () => ({
  getInstance: () => ({
    navigate: () => {},
    getPathname: () => '',
    __esModule: true,
  }),
  __esModule: true,
}));

jest.mock('../../../../../components/common/hocs', () => ({
  withUserAuthorizationPrompt: () => () => <></>,
  __esModule: true,
}));

jest.mock('../../../../../react-services/wz-request', () => ({
  WzRequest: {
    apiReq: jest.fn().mockResolvedValue({
      data: {
        data: {
          affected_items: [],
        },
      },
    }),
    __esModule: true,
  },
}));

jest.mock('./utils/wz-fetch', () => ({
  clusterReq: jest.fn().mockResolvedValue({
    data: {
      data: {
        affected_items: [],
      },
    },
  }),
  clusterNodes: jest.fn().mockResolvedValue({
    data: {
      data: {
        affected_items: [],
      },
    },
  }),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: jest.fn(),
  }),
}));

describe('WzConfigurationSwitch', () => {
  let updateClusterNodes: jest.Mock;
  let updateClusterNodeSelected: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    updateClusterNodes = jest.fn();
    updateClusterNodeSelected = jest.fn();
    (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
      content: {},
      modules: [],
    });
  });

  it("shouldn't render the agent info ribbon", () => {
    const { container } = render(
      <WzConfigurationSwitch
        agent={{ id: '001' }}
        updateClusterNodes={updateClusterNodes}
        updateClusterNodeSelected={updateClusterNodeSelected}
      />,
    );

    const agentInfoRibbon = container.querySelector(
      queryDataTestAttr('agent-info'),
    );

    expect(agentInfoRibbon).toBeFalsy();
  });

  it("shouldn't render any ribbon items", () => {
    const { container } = render(
      <WzConfigurationSwitch
        agent={{ id: '001' }}
        updateClusterNodes={updateClusterNodes}
        updateClusterNodeSelected={updateClusterNodeSelected}
      />,
    );

    const ribbonItems = container.querySelectorAll(
      queryDataTestAttr('ribbon-item', CSS.Attribute.Substring),
    );

    expect(ribbonItems.length).toBe(0);
  });

  /* An agent that never reported has no configuration to page through, so the
  prompt takes the place of the whole panel. */
  describe('agent that has not reported its configuration', () => {
    const renderSwitch = () =>
      render(
        <WzConfigurationSwitch
          agent={{ id: '001' }}
          updateClusterNodes={updateClusterNodes}
          updateClusterNodeSelected={updateClusterNodeSelected}
        />,
      );

    it('replaces the configuration with the prompt', async () => {
      (getAgentReportedConfiguration as jest.Mock).mockResolvedValue(null);

      const { findByText, queryByText } = renderSwitch();

      await findByText(/has not reported its configuration/i);
      expect(queryByText('Configuration')).not.toBeInTheDocument();
      // The way out of a prompt that has nothing to show for this agent.
      await findByText('Select agent');
    });

    it('reads the report once, for the sections to reuse', async () => {
      renderSwitch();

      await waitFor(() =>
        expect(getAgentReportedConfiguration).toHaveBeenCalledTimes(1),
      );
      expect(getAgentReportedConfiguration).toHaveBeenCalledWith('001');
    });

    it('keeps the configuration when the report cannot be read', async () => {
      (getAgentReportedConfiguration as jest.Mock).mockRejectedValue(
        new Error('Forbidden'),
      );

      const { queryByText } = renderSwitch();

      await waitFor(() =>
        expect(getAgentReportedConfiguration).toHaveBeenCalled(),
      );
      expect(
        queryByText(/has not reported its configuration/i),
      ).not.toBeInTheDocument();
    });
  });
});
