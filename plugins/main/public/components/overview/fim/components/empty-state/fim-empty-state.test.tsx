import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
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

const fimReport = (syscheck?: Record<string, unknown>) => ({
  content: syscheck ? { fim: { syscheck } } : {},
});

const renderView = (kind: 'findings' | 'dashboard', agentId?: string) => {
  const { container, unmount } = render(
    <I18nProvider>
      <FimEmptyStateView kind={kind} agent={{ id: agentId }} />
    </I18nProvider>,
  );
  const directories = container.querySelector(
    queryDataTestAttr('wzFimEmptyStateDirectories'),
  ) as HTMLElement;
  return { directories, unmount };
};

describe('FimEmptyStateView', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['findings', 'No file changes found'],
    ['dashboard', 'No monitored files found'],
  ] as const)('titles the %s empty state', (kind, title) => {
    renderView(kind);

    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('states the default directories and links the setup guide without a pinned agent', () => {
    const { directories } = renderView('findings');

    expect(getReport).not.toHaveBeenCalled();
    expect(directories).toHaveTextContent('By default, agents monitor /etc');
    const link = screen.getByRole('link', {
      name: /How to configure File Integrity Monitoring/,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/file-integrity/how-to-configure-fim.html',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('lists the directories the pinned agent reported until it unmounts', async () => {
    getReport.mockResolvedValue(
      fimReport({ directories: [{ dir: '/etc' }, { dir: '/home' }, '/etc'] }),
    );
    const { directories, unmount } = renderView('findings', '001');

    expect(screen.getByText(/^Loading the directories/)).toBeInTheDocument();
    expect(await screen.findByText('/home')).toBeInTheDocument();
    expect(getReport).toHaveBeenCalledWith('001');
    expect(directories.querySelectorAll('li')).toHaveLength(2);
    expect(
      screen.getByRole('link', { name: 'View the endpoint configuration' }),
    ).toHaveAttribute(
      'href',
      '/app/endpoints-summary#/agents?tab=configuration&agent=001',
    );

    unmount();

    expect(clearAgentReportedConfigurationCache).toHaveBeenCalled();
  });

  it.each([
    [
      'one directory',
      fimReport({ directories: { dir: '/srv' } }),
      '/srv',
      false,
    ],
    ['FIM disabled', fimReport({ disabled: 'yes' }), /is disabled/, false],
    ['no directories', fimReport(), /has no monitored directories/, false],
    ['no report', null, /hasn't reported its configuration/, true],
    ['a read error', new Error(), /couldn't be loaded/, true],
  ])('explains %s of the pinned agent', async (_, report, text, defaults) => {
    if (report instanceof Error) {
      getReport.mockRejectedValue(report);
    } else {
      getReport.mockResolvedValue(report);
    }
    const { directories } = renderView('findings', '001');

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(directories.textContent?.includes('By default')).toBe(defaults);
  });
});
