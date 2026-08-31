/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';

import { PanelModuleConfiguration } from './module_configuration';
import { getAgentReportedConfiguration } from '../../../../../controllers/management/components/management/configuration/utils/agent-config-service';
import { WzRequest } from '../../../../../react-services';
import { getErrorOrchestrator } from '../../../../../react-services/common-services';

jest.mock(
  '../../../../../controllers/management/components/management/configuration/utils/agent-config-service',
  () => ({
    getAgentReportedConfiguration: jest.fn(),
  }),
);

jest.mock('../../../../../react-services', () => ({
  WzRequest: {
    apiReq: jest.fn(),
  },
}));

const mockedGetErrorOrchestrator = {
  handleError: jest.fn(),
};

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: jest.fn(),
}));

jest.mock('../../../../../kibana-services', () => ({
  getUiSettings: () => ({
    get: () => false,
  }),
  getCookies: jest.fn(() => ({ get: jest.fn() })),
  setCookies: jest.fn(),
  getToasts: jest.fn(),
}));

const mockStore = configureMockStore();

const AGENT = { id: '001', name: 'agent-1' };

const settings = [
  {
    field: 'enabled',
    label: 'Service status',
  },
];

const renderPanel = (agent: { id: string; name?: string } = AGENT) => {
  const store = mockStore({
    appStateReducers: { currentAgentData: agent },
  });

  return render(
    <Provider store={store}>
      <PanelModuleConfiguration
        moduleTitle='Office 365'
        moduleIconType=''
        settings={settings}
        configurationAPIPartialPath='/wmodules/wmodules'
        documentationPath='cloud-security/office365/index.html'
        mapResponseConfiguration={(content, type, params) =>
          content?.office365
            ? {
                entity: 'Agent',
                name: params.name || '',
                configuration: content.office365,
              }
            : null
        }
      />
    </Provider>,
  );
};

const renderWithoutAgent = () =>
  render(
    <Provider store={mockStore({ appStateReducers: { currentAgentData: {} } })}>
      <PanelModuleConfiguration
        moduleTitle='Office 365'
        moduleIconType=''
        settings={settings}
        configurationAPIPartialPath='/wmodules/wmodules'
        mapResponseConfiguration={() => null}
      />
    </Provider>,
  );

const expectMessage = async (text: string) => {
  const { getByText } = renderPanel();

  await waitFor(() => expect(getByText(text)).toBeInTheDocument());
};

describe('PanelModuleConfiguration - agent branch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getErrorOrchestrator as jest.Mock).mockReturnValue(
      mockedGetErrorOrchestrator,
    );
  });

  it('happy path: renders the reported configuration without calling the Server API', async () => {
    (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
      content: { office365: { enabled: 'yes' } },
      modules: ['office365'],
    });

    const { getByText } = renderPanel();

    await waitFor(() => expect(getByText('yes')).toBeInTheDocument());
    expect(getAgentReportedConfiguration).toHaveBeenCalledWith('001');
    expect(WzRequest.apiReq).not.toHaveBeenCalled();
  });

  it('state (a): agent has not reported its configuration', async () => {
    (getAgentReportedConfiguration as jest.Mock).mockResolvedValue(null);

    await expectMessage('This agent has not reported its configuration.');
  });

  it('state (b): module key is absent from the report', async () => {
    (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
      content: {},
      modules: [],
    });

    await expectMessage(
      'The Office 365 module is not configured on this agent',
    );
  });

  it('state (c): the service rejects', async () => {
    (getAgentReportedConfiguration as jest.Mock).mockRejectedValue(
      new Error('index pattern not found'),
    );

    await expectMessage('Error fetching the module configuration');
    expect(mockedGetErrorOrchestrator.handleError).toHaveBeenCalled();
  });

  it('regression: content.wmodules is never read as a module container', async () => {
    (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
      content: { wmodules: { internal_options: { debug: 2 } } },
      modules: [],
    });

    await expectMessage(
      'The Office 365 module is not configured on this agent',
    );
  });

  it('manager branch: calls the Server API and not the agent-report service', async () => {
    (WzRequest.apiReq as jest.Mock).mockImplementation((_method, path) => {
      if (path === '/cluster/nodes') {
        return Promise.resolve({
          data: { data: { affected_items: [] } },
        });
      }
      return Promise.resolve({ data: { data: { wmodules: [] } } });
    });

    renderWithoutAgent();

    await waitFor(() =>
      expect(WzRequest.apiReq).toHaveBeenCalledWith(
        'GET',
        '/cluster/nodes',
        {},
      ),
    );
    expect(getAgentReportedConfiguration).not.toHaveBeenCalled();
  });

  it('module not configured: links to the module documentation', async () => {
    (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
      content: {},
      modules: [],
    });

    const { getByText } = renderPanel();

    await waitFor(() =>
      expect(
        getByText('The Office 365 module is not configured on this agent'),
      ).toBeInTheDocument(),
    );

    const link = getByText('Check the documentation');

    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute(
      'href',
      expect.stringContaining('cloud-security/office365/index.html'),
    );
  });

  it('no pinned agent: prompts to select one instead of reporting it unavailable', async () => {
    (WzRequest.apiReq as jest.Mock).mockImplementation((_method, path) => {
      if (path === '/cluster/nodes') {
        return Promise.resolve({ data: { data: { affected_items: [] } } });
      }

      return Promise.resolve({ data: { data: { wmodules: [] } } });
    });

    const { getByText, queryByText } = renderWithoutAgent();

    await waitFor(() =>
      expect(getByText('No agent is selected')).toBeInTheDocument(),
    );
    expect(
      getByText('Select an agent to see its Office 365 configuration.'),
    ).toBeInTheDocument();
    expect(queryByText('Module configuration unavailable')).toBeNull();
  });
});
