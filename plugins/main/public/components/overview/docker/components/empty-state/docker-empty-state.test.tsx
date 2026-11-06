import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { getAgentReportedConfiguration } from '../../../../../controllers/management/components/management/configuration/utils/agent-config-service';
import { BehaviorSubject } from 'rxjs';
import { getCore } from '../../../../../kibana-services';
import { DockerEmptyStateView } from './docker-empty-state';

jest.mock(
  '../../../../../controllers/management/components/management/configuration/utils/agent-config-service',
  () => ({
    getAgentReportedConfiguration: jest.fn(),
    clearAgentReportedConfigurationCache: jest.fn(),
  }),
);
jest.mock('../../../../../kibana-services', () => ({
  ...jest.requireActual('../../../../../kibana-services'),
  getCore: jest.fn(),
}));
jest.mock('../../../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn(),
}));
jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

const mockRegisteredApps = (ids: string[]) =>
  (getCore as jest.Mock).mockReturnValue({
    application: {
      applications$: new BehaviorSubject(new Map(ids.map(id => [id, { id }]))),
      getUrlForApp: (id: string) => `/app/${id}`,
      navigateToApp: jest.fn(),
    },
  });

const getReport = getAgentReportedConfiguration as jest.Mock;
const onUnpinAgent = jest.fn();

const renderView = (
  dataStatus: 'loading' | 'received' | 'never-received' | 'error',
  agentId?: string,
) =>
  render(
    <I18nProvider>
      <DockerEmptyStateView
        dataStatus={dataStatus}
        agent={{ id: agentId }}
        onUnpinAgent={onUnpinAgent}
      />
    </I18nProvider>,
  );

describe('DockerEmptyStateView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegisteredApps([]);
  });

  it('explains how to set up Docker monitoring when no finding has ever arrived', () => {
    renderView('never-received');

    expect(
      screen.getByText("Docker monitoring isn't set up yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enable the Docker listener on the agent/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Check that the docker integration is enabled, or that another integration generates Docker findings.',
      ),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: /How to monitor Docker environments/,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/container-security/monitoring-docker.html',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(getReport).not.toHaveBeenCalled();
  });

  it.each(['received', 'loading', 'error'] as const)(
    'keeps the search hint when the data status is %s',
    dataStatus => {
      renderView(dataStatus);

      expect(screen.getByText('No Docker findings found')).toBeInTheDocument();
      expect(
        screen.getByText('Try changing the search or time range.'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/isn't set up yet/)).not.toBeInTheDocument();
    },
  );

  it('says that the listener of the pinned agent is disabled and unpins it', async () => {
    getReport.mockResolvedValue({
      content: { 'docker-listener': { disabled: 'yes' } },
      modules: ['docker-listener'],
    });
    renderView('never-received', '001');

    expect(
      await screen.findByText(
        'The Docker listener is disabled on this endpoint.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unpin agent' }));
    expect(onUnpinAgent).toHaveBeenCalledTimes(1);
  });

  it('does not list the enabled listener as a pending step', async () => {
    getReport.mockResolvedValue({
      content: { 'docker-listener': { disabled: 'no' } },
      modules: ['docker-listener'],
    });
    renderView('never-received', '003');

    expect(
      await screen.findByText("Docker findings haven't arrived yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The Docker listener is enabled on this endpoint, but/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/check that the docker integration is enabled, or that/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/isn't set up yet/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Enable the Docker listener on the agent/),
    ).not.toBeInTheDocument();
  });

  it.each([
    ['never-received', true],
    ['never-received', false],
    ['received', false],
  ] as const)(
    'offers Ruleset management only for the set-up states (%s, registered: %s)',
    (dataStatus, registered) => {
      mockRegisteredApps(registered ? ['sa-integrations'] : []);
      renderView(dataStatus);

      const link = screen.queryByRole('link', {
        name: 'Ruleset management > Overview',
      });
      if (dataStatus === 'never-received' && registered) {
        expect(link).toHaveAttribute('href', '/app/sa-integrations');
      } else {
        expect(link).not.toBeInTheDocument();
      }
    },
  );

  it('does not offer Ruleset management when findings exist even if registered', () => {
    mockRegisteredApps(['sa-integrations']);
    renderView('received');

    expect(
      screen.queryByRole('link', { name: 'Ruleset management > Overview' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the set-up steps while the listener of the pinned agent is unknown', () => {
    getReport.mockReturnValue(new Promise(() => undefined));
    renderView('never-received', '003');

    expect(
      screen.getByText("Docker monitoring isn't set up yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enable the Docker listener on the agent/),
    ).toBeInTheDocument();
  });

  it('shows the search hint and the enabled listener when findings exist', async () => {
    getReport.mockResolvedValue({
      content: { 'docker-listener': { disabled: 'no' } },
      modules: ['docker-listener'],
    });
    renderView('received', '003');

    expect(
      await screen.findByText(
        'The Docker listener is enabled on this endpoint.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('No Docker findings found')).toBeInTheDocument();
  });

  it('says that the pinned agent has not reported its configuration', async () => {
    getReport.mockResolvedValue(null);
    renderView('received', '001');

    expect(
      await screen.findByText(
        "This endpoint hasn't reported its configuration yet.",
      ),
    ).toBeInTheDocument();
  });

  it('says when the configuration of the pinned agent cannot be loaded', async () => {
    getReport.mockRejectedValue(new Error('boom'));
    renderView('received', '001');

    expect(
      await screen.findByText(
        "The configuration of this endpoint couldn't be loaded.",
      ),
    ).toBeInTheDocument();
  });
});
