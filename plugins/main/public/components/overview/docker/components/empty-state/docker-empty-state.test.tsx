import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { getAgentReportedConfiguration } from '../../../../../controllers/management/components/management/configuration/utils/agent-config-service';
import { DockerEmptyStateView } from './docker-empty-state';

jest.mock(
  '../../../../../controllers/management/components/management/configuration/utils/agent-config-service',
  () => ({
    getAgentReportedConfiguration: jest.fn(),
    clearAgentReportedConfigurationCache: jest.fn(),
  }),
);
jest.mock('../../../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn(),
}));
jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

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
  beforeEach(() => jest.clearAllMocks());

  it('explains how to set up Docker monitoring when no finding has ever arrived', () => {
    renderView('never-received');

    expect(
      screen.getByText("Docker monitoring isn't set up yet"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Enable the Docker listener on the agent/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enable the docker integration.'),
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
