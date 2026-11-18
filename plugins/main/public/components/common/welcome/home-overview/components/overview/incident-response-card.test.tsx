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
    topResponses: [{ key: 'firewall-drop', count: 80 }],
    topAgents: [{ key: 'linux-1', count: 90 }],
  },
  indexPatternId: 'idx-ar',
};

beforeEach(() => jest.clearAllMocks());

describe('IncidentResponseCard', () => {
  it('shows the total and the top responses and agents', () => {
    render(<IncidentResponseCard incidentResponse={available} />);
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('Active responses triggered')).toBeInTheDocument();
    expect(screen.getByText('Top 5 active responses')).toBeInTheDocument();
    expect(screen.getByText('firewall-drop')).toBeInTheDocument();
    expect(screen.getByText('Top 5 agents')).toBeInTheDocument();
    expect(screen.getByText('linux-1')).toBeInTheDocument();
  });

  it('links the total to the Responses tab and each row to it filtered by that value', () => {
    render(<IncidentResponseCard incidentResponse={available} />);
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalledWith();
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalledWith(
      { field: 'wazuh.active_response.name', value: 'firewall-drop' },
      'idx-ar',
    );
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalledWith(
      { field: 'wazuh.agent.name', value: 'linux-1' },
      'idx-ar',
    );
  });

  it('shows one empty message instead of two empty lists when nothing ran', () => {
    const { container } = render(
      <IncidentResponseCard
        incidentResponse={{
          ...available,
          data: { total: 0, topResponses: [], topAgents: [] },
        }}
      />,
    );
    expect(
      screen.getByText('No active responses ran in this period'),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        '[data-test-subj="incident-response-top-responses"]',
      ),
    ).not.toBeInTheDocument();
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
