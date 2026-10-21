import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';
import {
  clearAgentReportedConfigurationCache,
  getAgentReportedConfiguration,
} from '../../../../../controllers/management/components/management/configuration/utils/agent-config-service';
import { FimEmptyStateView } from './fim-empty-state';

jest.mock(
  '../../../../../controllers/management/components/management/configuration/utils/agent-config-service',
  () => ({
    getAgentReportedConfiguration: jest.fn(),
    clearAgentReportedConfigurationCache: jest.fn(),
  }),
);

jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

jest.mock('../../../../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getUrlForApp: (appId: string, { path }: { path: string }) =>
        `/app/${appId}${path}`,
    }),
  },
}));

const getReport = getAgentReportedConfiguration as jest.Mock;

const renderView = (ui: React.ReactElement) =>
  render(<I18nProvider>{ui}</I18nProvider>);

const report = (syscheck: Record<string, unknown> | undefined) => ({
  content: syscheck ? { fim: { syscheck } } : {},
  modules: syscheck ? ['fim'] : [],
});

const directoriesSection = (container: HTMLElement) =>
  container.querySelector(
    queryDataTestAttr('wzFimEmptyStateDirectories'),
  ) as HTMLElement;

describe('FimEmptyStateView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('explains when Findings get a finding', () => {
    renderView(<FimEmptyStateView kind='findings' agent={{}} />);

    expect(screen.getByText('No file changes found')).toBeInTheDocument();
    expect(
      screen.getByText(/A finding is generated when a monitored file/),
    ).toBeInTheDocument();
  });

  it('explains when the Dashboard gets data', () => {
    renderView(<FimEmptyStateView kind='dashboard' agent={{}} />);

    expect(screen.getByText('No monitored files found')).toBeInTheDocument();
    expect(
      screen.getByText(/after the agents scan their monitored directories/),
    ).toBeInTheDocument();
  });

  it('states the default directories when no endpoint is pinned', () => {
    const { container } = renderView(
      <FimEmptyStateView kind='findings' agent={{}} />,
    );

    expect(getReport).not.toHaveBeenCalled();
    expect(directoriesSection(container)).toHaveTextContent(
      'By default, agents monitor /etc, /usr/bin, /usr/sbin, /bin, /sbin and /boot on Linux',
    );
    expect(directoriesSection(container)).toHaveTextContent(
      'in its Configuration, under Integrity monitoring',
    );
  });

  it('links to the page that explains how to monitor more directories', () => {
    renderView(<FimEmptyStateView kind='findings' agent={{}} />);

    const link = screen.getByRole('link', {
      name: /How to configure File Integrity Monitoring/,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/file-integrity/how-to-configure-fim.html',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('lists the directories that the pinned endpoint reported', async () => {
    getReport.mockResolvedValue(
      report({
        disabled: 'no',
        directories: [
          { dir: '/etc', opts: ['check_all'] },
          { dir: '/home/app', opts: ['realtime'] },
          { dir: '/etc', opts: [] },
        ],
      }),
    );

    const { container } = renderView(
      <FimEmptyStateView kind='findings' agent={{ id: '001' }} />,
    );

    expect(
      screen.getByText('Loading the directories this endpoint monitors'),
    ).toBeInTheDocument();
    expect(await screen.findByText('/home/app')).toBeInTheDocument();
    expect(getReport).toHaveBeenCalledWith('001');
    expect(directoriesSection(container).querySelectorAll('li')).toHaveLength(
      2,
    );
    expect(
      screen.getByRole('link', { name: 'View the endpoint configuration' }),
    ).toHaveAttribute(
      'href',
      '/app/endpoints-summary#/agents?tab=configuration&agent=001',
    );
    expect(directoriesSection(container)).not.toHaveTextContent('By default');
  });

  it('accepts a single reported directory', async () => {
    getReport.mockResolvedValue(report({ directories: { dir: '/srv' } }));

    renderView(<FimEmptyStateView kind='findings' agent={{ id: '001' }} />);

    expect(await screen.findByText('/srv')).toBeInTheDocument();
  });

  it('says when the module is disabled on the pinned endpoint', async () => {
    getReport.mockResolvedValue(
      report({ disabled: 'yes', directories: [{ dir: '/etc' }] }),
    );

    renderView(<FimEmptyStateView kind='findings' agent={{ id: '001' }} />);

    expect(
      await screen.findByText(
        'File Integrity Monitoring is disabled in the configuration this endpoint reported.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('/etc')).not.toBeInTheDocument();
  });

  it('says when the reported configuration has no monitored directories', async () => {
    getReport.mockResolvedValue(report(undefined));

    renderView(<FimEmptyStateView kind='findings' agent={{ id: '001' }} />);

    expect(
      await screen.findByText(
        'The configuration this endpoint reported has no monitored directories.',
      ),
    ).toBeInTheDocument();
  });

  it('falls back to the defaults when the endpoint has not reported its configuration', async () => {
    getReport.mockResolvedValue(null);

    const { container } = renderView(
      <FimEmptyStateView kind='findings' agent={{ id: '001' }} />,
    );

    expect(
      await screen.findByText(/hasn't reported its configuration yet/),
    ).toBeInTheDocument();
    expect(directoriesSection(container)).toHaveTextContent(
      'By default, agents monitor',
    );
  });

  it('falls back to the defaults when the configuration cannot be read', async () => {
    getReport.mockRejectedValue(new Error('Index pattern not found'));

    const { container } = renderView(
      <FimEmptyStateView kind='findings' agent={{ id: '001' }} />,
    );

    expect(
      await screen.findByText(
        "The directories this endpoint monitors couldn't be loaded.",
      ),
    ).toBeInTheDocument();
    expect(directoriesSection(container)).toHaveTextContent(
      'By default, agents monitor',
    );
  });

  it('discards the cached configuration when it unmounts', async () => {
    getReport.mockResolvedValue(report({ directories: [{ dir: '/etc' }] }));

    const { unmount } = renderView(
      <FimEmptyStateView kind='findings' agent={{ id: '001' }} />,
    );
    await screen.findByText('/etc');
    unmount();

    await waitFor(() =>
      expect(clearAgentReportedConfigurationCache).toHaveBeenCalled(),
    );
  });
});
