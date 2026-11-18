import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { IncidentResponseCard } from './incident-response-card';
import * as navigation from '../../utils/navigation';

jest.mock('../../utils/navigation', () => ({
  getActiveResponseUrl: jest.fn(() => '#incident-response'),
  getActiveResponseResponsesUrl: jest.fn(() => '#responses'),
}));

const available = {
  status: 'available' as const,
  data: {
    total: 128,
    topCommands: [{ key: 'firewall-drop', count: 80 }],
  },
  indexPatternId: 'idx-ar',
};

beforeEach(() => jest.clearAllMocks());

describe('IncidentResponseCard', () => {
  it('shows the total and the top commands', () => {
    render(<IncidentResponseCard incidentResponse={available} />);
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Active responses triggered')).toBeInTheDocument();
    expect(screen.getByText('Top 5 commands executed')).toBeInTheDocument();
    expect(screen.getByText('firewall-drop')).toBeInTheDocument();
  });

  it('links the total to the Responses tab and each command to it filtered', () => {
    render(<IncidentResponseCard incidentResponse={available} />);
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalledWith();
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalledWith(
      { field: 'wazuh.active_response.executable', value: 'firewall-drop' },
      'idx-ar',
    );
  });

  it('says no active response ran when the list is empty', () => {
    render(
      <IncidentResponseCard
        incidentResponse={{
          ...available,
          data: { total: 0, topCommands: [] },
        }}
      />,
    );
    expect(
      screen.getByText('No active responses ran in this period'),
    ).toBeInTheDocument();
  });

  it('offers to manage index patterns when the index pattern is missing', () => {
    render(
      <IncidentResponseCard
        incidentResponse={{
          status: 'unavailable',
          error: { kind: 'index-pattern-missing', message: 'No index pattern' },
        }}
      />,
    );
    expect(screen.getByText('No index pattern')).toBeInTheDocument();
    expect(screen.getByText('Manage index patterns')).toBeInTheDocument();
  });
});
