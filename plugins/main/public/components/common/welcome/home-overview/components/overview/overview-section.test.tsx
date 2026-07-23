import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverviewSection } from './overview-section';
import {
  useAgentStatus,
  useTopOperatingSystems,
  useTopNetworkServices,
} from '../../hooks/use-overview-data';
import { useInViewport } from '../../../../hooks';
import * as navigation from '../../utils/navigation';

// Explicit factories so the real modules (and their heavy data-source imports)
// are never loaded — this section is tested purely against the seam boundary.
jest.mock('../../hooks/use-overview-data', () => ({
  useAgentStatus: jest.fn(),
  useTopOperatingSystems: jest.fn(),
  useTopNetworkServices: jest.fn(),
}));
jest.mock('../../utils/navigation', () => ({
  getDeployAgentUrl: jest.fn(() => 'https://example.test/deploy'),
  getAgentsUrl: jest.fn(() => '#agents'),
  goToAgentsByStatus: jest.fn(),
  getThreatHuntingUrl: jest.fn(() => '#threat-hunting'),
  getMitreUrl: jest.fn(),
  getItHygieneUrl: jest.fn(() => '#it-hygiene'),
  getMitreUrlTactic: jest.fn(),
  getDiscoverFindingsBySeverityUrl: jest.fn(() => '#discover'),
}));
jest.mock('../../../../hooks', () => ({
  useInViewport: jest.fn(() => [{ current: null }, true]),
}));
// WzButtonPermissions pulls in a react-redux `useSelector` for RBAC checks —
// out of scope here, so stub it down to a plain link (same as
// agents-by-status.test.tsx).
jest.mock('../../../../permissions/button', () => ({
  WzButtonPermissions: ({ children, ...rest }: any) => (
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
  asMock(useTopOperatingSystems).mockReturnValue({
    status: 'available',
    data: [{ key: 'Ubuntu 24.04.2 LTS', count: 2 }],
  });
  asMock(useTopNetworkServices).mockReturnValue({
    status: 'available',
    data: [{ key: 'svchost.exe', count: 13 }],
  });
  asMock(useInViewport).mockReturnValue([{ current: null }, true]);
});

describe('OverviewSection', () => {
  it('renders every OVERVIEW widget when all groups are available', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    expect(screen.getByText('Agents by status')).toBeInTheDocument();
    expect(screen.getByText('Findings')).toBeInTheDocument();
    expect(screen.getByText('MITRE ATT&CK top tactics')).toBeInTheDocument();
    expect(screen.getByText('Top 5 operating systems')).toBeInTheDocument();
    expect(screen.getByText('Top 5 network services')).toBeInTheDocument();
    // data flowed through: active hero + a severity value + a tactic + a row
    expect(screen.getByText('agents active')).toBeInTheDocument();
    expect(screen.getByText('35,682')).toBeInTheDocument();
    expect(screen.getByText('Initial Access')).toBeInTheDocument();
    expect(screen.getAllByText('svchost.exe').length).toBeGreaterThan(0);
  });

  it('keeps a widget whose dependency is unavailable (never hidden)', () => {
    asMock(useTopNetworkServices).mockReturnValue({ status: 'unavailable' });
    const { container } = render(
      <OverviewSection findings={findingsAvailable} />,
    );
    const panel = container.querySelector(
      '[data-test-subj="home-overview-top-network-services"]',
    );
    expect(panel).toBeInTheDocument();
    // a table panel shows a neutral placeholder when its data source is absent
    expect(panel?.textContent).toContain('Not available');
    expect(screen.getByText('Top 5 operating systems')).toBeInTheDocument();
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

  it('defers the inventory groups until the row enters the viewport', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, false]);
    render(<OverviewSection findings={findingsAvailable} />);
    expect(asMock(useTopOperatingSystems)).toHaveBeenCalledWith(false);
    expect(asMock(useTopNetworkServices)).toHaveBeenCalledWith(false);
  });

  it('enables the inventory groups once visible', () => {
    asMock(useInViewport).mockReturnValue([{ current: null }, true]);
    render(<OverviewSection findings={findingsAvailable} />);
    expect(asMock(useTopOperatingSystems)).toHaveBeenCalledWith(true);
  });

  it('navigates to Threat Hunting from the findings header link', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    fireEvent.click(screen.getByText('Threat Hunting'));
    expect(navigation.getThreatHuntingUrl).toHaveBeenCalled();
  });

  it('navigates to the selected MITRE tactic by its external id', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    fireEvent.click(screen.getByText('Initial Access'));
    expect(navigation.getMitreUrlTactic).toHaveBeenCalledWith('TA0001');
  });

  it('navigates to Agents from the "Agents by status" header link', () => {
    render(<OverviewSection findings={findingsAvailable} />);
    fireEvent.click(screen.getByText('Agents'));
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
