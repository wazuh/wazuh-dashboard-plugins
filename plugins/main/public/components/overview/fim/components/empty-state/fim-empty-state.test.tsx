import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@osd/i18n/react';
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
jest.mock('../../../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn(),
}));
jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));

const getReport = getAgentReportedConfiguration as jest.Mock;
const onUnpinAgent = jest.fn();

const renderView = (
  kind: 'findings' | 'dashboard',
  agentId?: string,
  agentName?: string,
) =>
  render(
    <I18nProvider>
      <FimEmptyStateView
        kind={kind}
        agent={{ id: agentId, name: agentName }}
        onUnpinAgent={onUnpinAgent}
      />
    </I18nProvider>,
  );

describe('FimEmptyStateView', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['findings', 'No file changes found', /search or time range/],
    ['dashboard', 'No monitored files found', /Try changing the search\./],
  ] as const)('titles the %s empty state', (kind, title, hint) => {
    renderView(kind);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(hint)).toBeInTheDocument();
  });

  it('asks to select an agent and links the setup guide without a pinned agent', () => {
    renderView('findings');

    expect(getReport).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /Use Explore agent to see the directories an agent monitors\./,
      ),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', {
      name: /How to configure File Integrity Monitoring/,
    });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/file-integrity/how-to-configure-fim.html',
    );
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('shows the directories the pinned agent reported as code until it unmounts', async () => {
    getReport.mockResolvedValue({
      content: {
        fim: { syscheck: { directories: [{ dir: '/etc' }, '/home', '/etc'] } },
      },
    });
    const { container, unmount } = renderView('findings', '001');

    expect(screen.getByText(/Loading the monitored/)).toBeInTheDocument();
    expect(await screen.findByText('/home')).toBeInTheDocument();
    expect(getReport).toHaveBeenCalledWith('001');
    expect(
      [...container.querySelectorAll('code')].map(code => code.textContent),
    ).toEqual(['/etc', '/home']);

    unmount();

    expect(clearAgentReportedConfigurationCache).toHaveBeenCalled();
  });

  it('names the pinned agent and offers to unpin it while loading', () => {
    getReport.mockReturnValue(new Promise(() => {}));
    renderView('findings', '001', 'web-01');

    expect(
      screen.getByText('No file changes found for web-01 (001)'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unpin agent' }));
    expect(onUnpinAgent).toHaveBeenCalledTimes(1);
  });

  it('says when FIM is disabled on the pinned agent', async () => {
    getReport.mockResolvedValue({
      content: { fim: { syscheck: { disabled: 'yes' } } },
    });
    renderView('findings', '001');

    const text = await screen.findByText(
      /File Integrity Monitoring is disabled on this endpoint\./,
    );
    expect(text).not.toHaveTextContent('Dashboard and Inventory');
    expect(
      screen.getByRole('link', { name: /How to configure/ }),
    ).toBeInTheDocument();
  });
});
