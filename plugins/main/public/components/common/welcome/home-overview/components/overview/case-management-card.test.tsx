import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { CaseManagementCard } from './case-management-card';
import * as navigation from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getCaseManagementUrl: jest.fn(() => '#case-management'),
  getCaseManagementCasesUrl: jest.fn(() => '#cases'),
}));

const available = {
  status: 'available' as const,
  data: {
    total: 12,
    byStatus: { active: 3, acknowledged: 2, completed: 7 },
    openBySeverity: { critical: 1, high: 2, medium: 2, low: 0 },
  },
  indexPatternId: 'idx-findings',
};

beforeEach(() => jest.clearAllMocks());

describe('CaseManagementCard', () => {
  it('shows the cases per status and the open cases by severity', () => {
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
  });

  it('links the tiles and severities to the Cases tab, filtered', () => {
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
  });

  it('says how to create a case when there is none', () => {
    const { container } = render(
      <CaseManagementCard
        cases={{
          ...available,
          data: {
            total: 0,
            byStatus: { active: 0, acknowledged: 0, completed: 0 },
            openBySeverity: {},
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

  it('keeps the tiles when every case has a status without a tile', () => {
    const { container } = render(
      <CaseManagementCard
        cases={{
          ...available,
          data: {
            total: 2,
            byStatus: { active: 0, acknowledged: 0, completed: 0 },
            openBySeverity: {
              critical: 0,
              high: 0,
              medium: 0,
              low: 0,
              informational: 0,
            },
          },
        }}
      />,
    );
    expect(
      container.querySelector('[data-test-subj="case-status-completed"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('No open cases')).toBeInTheDocument();
    expect(screen.queryByText(/No cases yet/)).not.toBeInTheDocument();
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
