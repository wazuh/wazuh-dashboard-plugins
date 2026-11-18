import '@testing-library/jest-dom';
import React from 'react';
import moment from 'moment';
import { render, screen, within } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { CaseManagementCard } from './case-management-card';
import * as navigation from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getCaseManagementUrl: jest.fn(() => '#case-management'),
  getCaseManagementCasesUrl: jest.fn(() => '#cases'),
}));
jest.mock('../../../../../../react-services', () => ({
  formatUIDate: jest.fn((date?: string) => (date ? `date:${date}` : '-')),
}));

const available = {
  status: 'available' as const,
  data: {
    byStatus: { active: 3, acknowledged: 2, completed: 7 },
    openBySeverity: { critical: 1, high: 2, medium: 2, low: 0 },
    recentOpen: [
      {
        id: 'doc-1',
        title: 'SSH brute force on linux-1',
        status: 'acknowledged',
        priority: 'urgent',
        updatedAt: '2026-11-18T10:00:00Z',
      },
    ],
  },
  indexPatternId: 'idx-findings',
};

beforeEach(() => jest.clearAllMocks());

describe('CaseManagementCard', () => {
  it('shows the cases per status, the open cases by severity and the latest open cases', () => {
    const { container } = render(<CaseManagementCard cases={available} />);
    expect(screen.getByText('Case Management')).toBeInTheDocument();
    expect(screen.getByText('Current state')).toBeInTheDocument();
    const tile = (status: string) =>
      container.querySelector(
        `[data-test-subj="case-status-${status}"]`,
      ) as HTMLElement;
    expect(within(tile('active')).getByText('3')).toBeInTheDocument();
    expect(within(tile('acknowledged')).getByText('2')).toBeInTheDocument();
    expect(within(tile('completed')).getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Open cases by severity')).toBeInTheDocument();

    const table = container.querySelector(
      '[data-test-subj="latest-open-cases"]',
    ) as HTMLElement;
    expect(
      within(table).getByText('SSH brute force on linux-1'),
    ).toBeInTheDocument();
    expect(within(table).getByText('Urgent')).toBeInTheDocument();
    expect(within(table).getByText('Acknowledged')).toBeInTheDocument();
    // Relative time; the full date is in its tooltip.
    expect(
      within(table).getByText(moment('2026-11-18T10:00:00Z').fromNow()),
    ).toBeInTheDocument();
  });

  it('links the tiles, severities and cases to the Cases tab, filtered', () => {
    render(<CaseManagementCard cases={available} />);
    const calls = (navigation.getCaseManagementCasesUrl as jest.Mock).mock
      .calls;
    expect(calls).toContainEqual([
      [{ field: 'wazuh.case.status', value: 'active' }],
      'idx-findings',
    ]);
    expect(calls).toContainEqual([
      [
        { field: 'wazuh.case.status', value: ['active', 'acknowledged'] },
        { field: 'wazuh.case.severity', value: 'critical' },
      ],
      'idx-findings',
    ]);
    expect(calls).toContainEqual([
      [{ field: '_id', value: 'doc-1' }],
      'idx-findings',
    ]);
  });

  it('says how to create a case when there is none', () => {
    const { container } = render(
      <CaseManagementCard
        cases={{
          ...available,
          data: {
            byStatus: { active: 0, acknowledged: 0, completed: 0 },
            openBySeverity: {},
            recentOpen: [],
          },
        }}
      />,
    );
    expect(
      screen.getByText(
        'No cases yet. Open a finding and create one from its Case tab.',
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="case-status-active"]'),
    ).not.toBeInTheDocument();
  });

  it('keeps the tiles but no table when every case is closed', () => {
    const { container } = render(
      <CaseManagementCard
        cases={{
          ...available,
          data: {
            byStatus: { active: 0, acknowledged: 0, completed: 4 },
            openBySeverity: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              informational: 0,
            },
            recentOpen: [],
          },
        }}
      />,
    );
    expect(
      container.querySelector('[data-test-subj="case-status-completed"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('No open cases')).toBeInTheDocument();
    expect(
      container.querySelector('[data-test-subj="latest-open-cases"]'),
    ).not.toBeInTheDocument();
  });

  it('shows the permission message when the user cannot read the cases', () => {
    render(
      <CaseManagementCard
        cases={{
          status: 'error',
          error: {
            kind: 'permission-denied',
            message: "You don't have permission to view this data.",
          },
        }}
      />,
    );
    expect(
      screen.getByText("You don't have permission to view this data."),
    ).toBeInTheDocument();
  });
});
