import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import '../../test-utils/setup-home-overview-test';
import { getCore } from '../../../../../../kibana-services';
import {
  IncidentResponseCard,
  IncidentResponseCardProps,
} from './incident-response-card';
import * as navigation from '../../utils/navigation';
import { SeriousFindings } from '../../interfaces/types';

jest.mock('../../utils/navigation', () => ({
  getActiveResponseUrl: jest.fn(() => '#incident-response'),
  getActiveResponseResponsesUrl: jest.fn(() => '#responses'),
  getCreateActiveResponseUrl: jest.fn(() => '#create'),
  getFindingsByRuleUrl: jest.fn((id: string) => `#rule-${id}`),
  isActiveResponsesRegistered: jest.fn((apps: ReadonlyMap<string, unknown>) =>
    apps.has('active-responses'),
  ),
}));

const asMock = (fn: unknown) => fn as jest.Mock;
const bySubj = (container: HTMLElement, subj: string) =>
  container.querySelector(`[data-test-subj="${subj}"]`) as HTMLElement;

const incidentResponse = {
  status: 'available' as const,
  data: {
    total: 250,
    answered: { byLevel: { critical: 4, high: 6 }, byRule: { c1: 4 } },
  },
  indexPatternId: 'idx-ar',
};

const seriousFindings: SeriousFindings = {
  byLevel: { critical: 10, high: 30 },
  rules: [
    { id: 'h1', title: 'Brute force', level: 'high', count: 30 },
    { id: 'c1', title: 'Malware alert', level: 'critical', count: 10 },
  ],
  partial: false,
};

const findingsWith = (serious: SeriousFindings = seriousFindings) =>
  ({
    status: 'available',
    data: { severity: {}, seriousFindings: serious },
    indexPatternId: 'idx-findings',
  } as unknown as IncidentResponseCardProps['findings']);

const withApplications = (ids: string[]) =>
  asMock(getCore).mockReturnValue({
    application: {
      getUrlForApp: jest.fn(),
      applications$: new BehaviorSubject(new Map(ids.map(id => [id, {}]))),
    },
    uiSettings: { get: jest.fn() },
  });

beforeEach(() => {
  jest.clearAllMocks();
  withApplications(['active-responses']);
});

describe('IncidentResponseCard', () => {
  it('shows the responses, the unanswered findings and the coverage', () => {
    const { container } = render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={findingsWith()}
      />,
    );
    expect(screen.getByText('Incident Response')).toBeInTheDocument();
    expect(bySubj(container, 'incident-response-total')).toHaveTextContent(
      '250',
    );
    // 40 critical/high findings, 10 answered.
    expect(bySubj(container, 'incident-response-unanswered')).toHaveTextContent(
      '30',
    );
    expect(
      bySubj(container, 'incident-response-coverage-value'),
    ).toHaveTextContent('25%');
  });

  it('lists the rules with unanswered findings, critical first, linked to their findings', () => {
    const { container } = render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={findingsWith()}
      />,
    );
    const rows = container.querySelectorAll(
      '[data-test-subj="incident-response-gaps-row"]',
    );
    expect(rows[0]).toHaveTextContent('Malware alert');
    expect(rows[0]).toHaveTextContent('6 of 10 unanswered');
    expect(rows[1]).toHaveTextContent('Brute force');
    expect(rows[1]).toHaveTextContent('30 unanswered');
    expect(navigation.getFindingsByRuleUrl).toHaveBeenCalledWith(
      'c1',
      'critical',
      'idx-findings',
    );
    expect(navigation.getActiveResponseResponsesUrl).toHaveBeenCalledWith();
  });

  it('offers to create an active response only when the app is installed', () => {
    const { container, unmount } = render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={findingsWith()}
      />,
    );
    expect(bySubj(container, 'incident-response-create')).toBeInTheDocument();
    unmount();

    withApplications([]);
    const { container: without } = render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={findingsWith()}
      />,
    );
    expect(bySubj(without, 'incident-response-create')).toBeNull();
  });

  it('says every finding got a response when no rule is left', () => {
    render(
      <IncidentResponseCard
        incidentResponse={{
          ...incidentResponse,
          data: {
            total: 250,
            answered: {
              byLevel: { critical: 10, high: 30 },
              byRule: { c1: 10, h1: 30 },
            },
          },
        }}
        findings={findingsWith()}
      />,
    );
    expect(
      screen.getByText('Every critical and high finding got a response'),
    ).toBeInTheDocument();
  });

  it('says so when there is no critical or high finding', () => {
    const { container } = render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={findingsWith({ byLevel: {}, rules: [], partial: false })}
      />,
    );
    expect(
      bySubj(container, 'incident-response-no-serious-findings'),
    ).toHaveTextContent('No critical or high findings in this period');
    expect(bySubj(container, 'incident-response-coverage')).toBeNull();
  });

  it('notes that more rules exist past the ones it looked at', () => {
    render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={findingsWith({ ...seriousFindings, partial: true })}
      />,
    );
    expect(screen.getByText('· more may exist')).toBeInTheDocument();
  });

  it('keeps the responses when the findings search fails', () => {
    const { container } = render(
      <IncidentResponseCard
        incidentResponse={incidentResponse}
        findings={
          {
            status: 'error',
            error: { kind: 'error', message: 'Findings failed' },
          } as unknown as IncidentResponseCardProps['findings']
        }
      />,
    );
    expect(bySubj(container, 'incident-response-total')).toHaveTextContent(
      '250',
    );
    expect(screen.getByText('Findings failed')).toBeInTheDocument();
    expect(bySubj(container, 'incident-response-gaps')).toBeNull();
  });

  it('offers to manage index patterns when the index pattern is missing', () => {
    render(
      <IncidentResponseCard
        incidentResponse={{
          status: 'unavailable',
          error: { kind: 'index-pattern-missing', message: 'No index pattern' },
        }}
        findings={findingsWith()}
      />,
    );
    expect(screen.getByText('No index pattern')).toBeInTheDocument();
    expect(screen.getByText('Manage index patterns')).toBeInTheDocument();
  });
});
