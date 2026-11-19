import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { OverviewSection } from './overview-section';
import {
  useAgentStatus,
  useCaseManagementOverview,
  useIncidentResponseOverview,
} from '../../hooks/use-overview-data';
import * as navigation from '../../utils/navigation';
import { IncidentResponseCard } from './incident-response-card';
import { useUserPermissionsRequirements } from '../../../../hooks/useUserPermissions';

// Explicit factories so the real modules (and their heavy data-source imports)
// are never loaded — this section is tested purely against the seam boundary.
jest.mock('../../hooks/use-overview-data', () => ({
  useAgentStatus: jest.fn(),
  useIncidentResponseOverview: jest.fn(),
  useCaseManagementOverview: jest.fn(),
}));
// The cards have their own suites; here only their place in the layout matters.
jest.mock('./incident-response-card', () => ({
  IncidentResponseCard: jest.fn(() => (
    <div data-test-subj='incident-response-card' />
  )),
}));
jest.mock('./case-management-card', () => ({
  CaseManagementCard: () => <div data-test-subj='case-management-card' />,
}));
jest.mock('../../utils/navigation', () => ({
  getDeployAgentUrl: jest.fn(() => 'https://example.test/deploy'),
  getAgentsUrl: jest.fn(() => '#agents'),
  goToAgentsByStatus: jest.fn(),
  getThreatHuntingUrl: jest.fn(() => '#threat-hunting'),
  getMitreUrl: jest.fn(),
  getMitreFrameworkTacticUrl: jest.fn(() => '#mitre-framework'),
  getDiscoverFindingsBySeverityUrl: jest.fn(() => '#discover'),
}));
// WzButtonPermissions pulls in a react-redux `useSelector` for RBAC checks —
// out of scope here, so stub it down to a plain link (same as
// agents-by-status.test.tsx).
jest.mock('../../../../permissions/button', () => ({
  WzButtonPermissions: ({
    children,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...rest}>{children}</a>
  ),
}));

jest.mock('../../../../hooks/useUserPermissions', () => ({
  useUserPermissionsRequirements: jest.fn(),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

const findingsAvailable = {
  status: 'available' as const,
  data: {
    severity: { critical: 1, high: 2, medium: 35682, low: 4 },
    topTactics: [{ key: 'Initial Access', count: 36231, id: 'TA0001' }],
    totalFindings: 40614,
    topRules: [],
    techniquesCount: 7,
    topTechniques: [],
  },
  indexPatternId: 'idx-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  asMock(useUserPermissionsRequirements).mockReturnValue([false, {}]);
  asMock(useIncidentResponseOverview).mockReturnValue({ status: 'loading' });
  asMock(useCaseManagementOverview).mockReturnValue({ status: 'loading' });
  asMock(useAgentStatus).mockReturnValue({
    status: 'available',
    data: {
      active: 5,
      disconnected: 0,
      pending: 0,
      neverConnected: 2,
      total: 7,
    },
  });
});

describe('OverviewSection', () => {
  it('renders every OVERVIEW widget when all groups are available', () => {
    const { container } = render(
      <OverviewSection findings={findingsAvailable} />,
    );
    expect(screen.getByText('Agents by status')).toBeInTheDocument();
    expect(screen.getByText('Findings')).toBeInTheDocument();
    expect(screen.getByText('MITRE ATT&CK top tactics')).toBeInTheDocument();
    // data flowed through: active hero + a severity value + a tactic
    expect(container.textContent).toContain('agents active');
    expect(screen.getByText('35,682')).toBeInTheDocument();
    expect(screen.getByText('Initial Access')).toBeInTheDocument();
  });

  it('places Incident Response and Case management between the findings and MITRE rows', () => {
    const { container } = render(
      <OverviewSection findings={findingsAvailable} />,
    );
    const order = [
      'home-overview-findings-severity',
      'incident-response-card',
      'case-management-card',
      'home-overview-mitre-tactics',
    ].map(testSubj =>
      container.querySelector(`[data-test-subj="${testSubj}"]`),
    );
    order.reduce((previous, current) => {
      expect(previous).toBeInTheDocument();
      expect(
        previous!.compareDocumentPosition(current!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      return current;
    });
    expect(useIncidentResponseOverview).toHaveBeenCalledWith(true);
    expect(useCaseManagementOverview).toHaveBeenCalledWith(true);
  });

  it('gives Incident Response the findings search, which carries the critical/high rules', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    expect((IncidentResponseCard as jest.Mock).mock.calls[0][0].findings).toBe(
      findingsAvailable,
    );
  });

  it('shows a contained error for a failed group (distinct from hidden)', () => {
    const { container } = render(
      <OverviewSection findings={{ status: 'error' }} />,
    );
    // findings + mitre panels (same group) render, with error boxes
    expect(
      container.querySelectorAll('[data-test-subj="widget-group-error"]')
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Findings')).toBeInTheDocument();
  });

  it('links each top tactic to the MITRE Framework tab, filtered to that tactic', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    expect(screen.getByText('Initial Access').closest('a')).toBeInTheDocument();
    expect(navigation.getMitreFrameworkTacticUrl).toHaveBeenCalledWith(
      { key: 'Initial Access', count: 36231, id: 'TA0001' },
      'idx-1',
    );
  });

  it('navigates to Threat Hunting from the Findings card title', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    fireEvent.click(screen.getByText('Findings'));
    expect(navigation.getThreatHuntingUrl).toHaveBeenCalled();
  });

  it('navigates to Agents from the "Agents by status" card title', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    fireEvent.click(screen.getByText('Agents by status'));
    expect(navigation.getAgentsUrl).toHaveBeenCalled();
  });

  it('shows a "deploy new agent" prompt instead of counts when the fleet is empty', () => {
    asMock(useAgentStatus).mockReturnValue({
      status: 'available',
      data: {
        active: 0,
        disconnected: 0,
        pending: 0,
        neverConnected: 0,
        total: 0,
      },
    });
    const { container } = render(
      <OverviewSection findings={findingsAvailable} />,
    );
    expect(container.textContent).toContain(
      'This instance has no agents registered.',
    );
    expect(screen.queryByText('agents active')).not.toBeInTheDocument();
  });

  it('shows the missing permissions instead of "no agents" when agent:read is missing', () => {
    asMock(useUserPermissionsRequirements).mockReturnValue([
      [[{ action: 'agent:read', resource: 'agent:id:*' }]],
      {},
    ]);
    asMock(useAgentStatus).mockReturnValue({
      status: 'available',
      data: {
        active: 0,
        disconnected: 0,
        pending: 0,
        neverConnected: 0,
        total: 0,
      },
    });
    const { container } = render(
      <OverviewSection findings={findingsAvailable} />,
    );
    expect(container.textContent).toContain('You have no permissions');
    expect(container.textContent).not.toContain(
      'This instance has no agents registered.',
    );
    expect(screen.queryByText('Deploy new agent')).not.toBeInTheDocument();
  });
});
