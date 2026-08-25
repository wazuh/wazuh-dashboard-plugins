import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '../../test-utils/setup-home-overview-test';
import { OverviewSection } from './overview-section';
import { useAgentStatus } from '../../hooks/use-overview-data';
import * as navigation from '../../utils/navigation';

// Explicit factories so the real modules (and their heavy data-source imports)
// are never loaded — this section is tested purely against the seam boundary.
jest.mock('../../hooks/use-overview-data', () => ({
  useAgentStatus: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  getDeployAgentUrl: jest.fn(() => 'https://example.test/deploy'),
  getAgentsUrl: jest.fn(() => '#agents'),
  goToAgentsByStatus: jest.fn(),
  getThreatHuntingUrl: jest.fn(() => '#threat-hunting'),
  getMitreUrl: jest.fn(),
  getMitreIntelligenceResourceUrl: jest.fn(() => '#mitre-intelligence'),
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

  it('links each top tactic to its MITRE Intelligence detail', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    expect(screen.getByText('Initial Access').closest('a')).toBeInTheDocument();
    expect(navigation.getMitreIntelligenceResourceUrl).toHaveBeenCalledWith(
      'tactics',
      { key: 'Initial Access', count: 36231, id: 'TA0001' },
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
});
