import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WzRequest } from '../../../../../../../../react-services/wz-request';
import NavigationService from '../../../../../../../../react-services/navigation-service';
import { FlyoutTechnique } from './flyout-technique';

jest.mock('../../../../../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));
jest.mock('../../../../../../../../kibana-services');
jest.mock('../../../../../../../../../../../src/plugins/data/public/', () => ({
  FilterManager: jest.fn(),
}));
jest.mock('./technique-row-details', () => () => null);
jest.mock('./flyout-technique-columns', () => ({
  techniquesColumns: [],
  agentTechniquesColumns: [],
}));
jest.mock('../../../../../../../common/wazuh-discover/render-columns', () => ({
  wzDiscoverRenderColumns: [],
}));
jest.mock('../../../../../../../common/search-bar/set-filters', () => ({
  setFilters: jest.fn(),
}));
jest.mock('../../../../../../../../components/common/data-source', () => ({
  PatternDataSource: jest.fn(),
}));
jest.mock('../../../../../../../../redux/store', () => ({
  getState: () => ({ appStateReducers: {} }),
}));
jest.mock('../../../../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));
jest.mock('../../../../../../../../react-services/navigation-service', () => {
  const updateAndNavigateSearchParams = jest.fn();
  return {
    __esModule: true,
    default: { getInstance: () => ({ updateAndNavigateSearchParams }) },
  };
});
jest.mock('../../../../../../../../components/common/flyouts', () => ({
  WzFlyout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
// The findings table reports its query results; the stats are read from them
jest.mock(
  '../../../../../../../common/wazuh-discover/wz-flyout-discover',
  () => ({
    WazuhFlyoutDiscover: ({ onResults }: { onResults: (r: any) => void }) => {
      const { useEffect } = jest.requireActual('react');
      useEffect(() => {
        onResults({
          hits: { total: { value: 175 } },
          aggregations: {
            agents: { value: 8 },
            levels: { buckets: [{ key: 'high' }, { key: 'critical' }] },
            lastSeen: { value: null },
          },
        });
      }, []);
      return <div>findings table</div>;
    },
  }),
);

const apiReq = WzRequest.apiReq as jest.Mock;
const navigate = NavigationService.getInstance()
  .updateAndNavigateSearchParams as jest.Mock;

const items = (affected_items: any[]) => ({
  data: { data: { affected_items } },
});

const BRUTE_FORCE = {
  external_id: 'T1110',
  name: 'Brute Force',
  description: 'Guess passwords.(Citation: Dragos)',
  url: 'https://attack.mitre.org/techniques/T1110',
  mitre_version: '2.8',
  deprecated: 0,
  tactics: ['x-mitre-tactic--1'],
  mitigations: ['coa--1', 'coa--2', 'coa--3', 'coa--4'],
  groups: [],
  software: [],
  references: [{ source: 'Dragos', url: 'https://example.com/dragos' }],
};

const mockApi = (techniques: Record<string, any>, subtechniques: any[] = []) =>
  apiReq.mockImplementation(async (_method, path: string, options) => {
    const q: string | undefined = options?.params?.q;
    if (path === '/mitre/techniques' && q?.startsWith('external_id~')) {
      return items(subtechniques);
    }
    if (path === '/mitre/techniques') {
      const technique = techniques[q!.replace('external_id=', '')];
      if (technique instanceof Error) {
        throw technique;
      }
      return items(technique ? [technique] : []);
    }
    if (path.startsWith('/mitre/tactics')) {
      return items([{ external_id: 'TA0006', name: 'Credential Access' }]);
    }
    if (path.startsWith('/mitre/mitigations')) {
      return items([
        { external_id: 'M1027', name: 'Password Policies' },
        { external_id: 'M1036', name: 'Account Use Policies' },
        { external_id: 'M1032', name: 'Multi-factor Authentication' },
      ]);
    }
    return items([]);
  });

const renderFlyout = (currentTechnique: string, openDiscover = jest.fn()) =>
  render(
    <FlyoutTechnique
      currentTechnique={currentTechnique}
      onChangeFlyout={jest.fn()}
      openDiscover={openDiscover}
      filterParams={{ filters: [] }}
    />,
  );

describe('FlyoutTechnique', () => {
  beforeEach(() => {
    apiReq.mockReset();
    navigate.mockReset();
  });

  it('shows the technique, its tactics, related items and stats', async () => {
    mockApi({ T1110: BRUTE_FORCE }, [
      { external_id: 'T1110.001', name: 'Password Guessing' },
    ]);
    renderFlyout('T1110');

    expect(await screen.findByText('Brute Force')).toBeTruthy();
    expect(await screen.findByText('Credential Access')).toBeTruthy();
    expect(
      screen
        .getByText('View on MITRE ATT&CK')
        .closest('a')
        ?.getAttribute('href'),
    ).toBe('https://attack.mitre.org/techniques/T1110');
    expect(screen.getByText('[1]').closest('a')?.getAttribute('href')).toBe(
      'https://example.com/dragos',
    );
    expect(await screen.findByText('Password Policies')).toBeTruthy();
    expect(screen.getByText('and 1 more')).toBeTruthy();
    expect(screen.getByText('Mitigations (4)')).toBeTruthy();
    expect(screen.getByText('Used by groups (0)')).toBeTruthy();
    expect(screen.getAllByText('None').length).toBe(2);
    expect(await screen.findByText('Password Guessing')).toBeTruthy();
    expect(screen.getByText('175')).toBeTruthy();
    expect(screen.getByText('Critical')).toBeTruthy();
    expect(screen.getByText('Filtered to T1110')).toBeTruthy();
    // Only the referenced tactics are requested, never the whole collection
    expect(apiReq).toHaveBeenCalledWith(
      'GET',
      '/mitre/tactics?tactic_ids=x-mitre-tactic--1',
      {},
    );
    expect(apiReq).not.toHaveBeenCalledWith('GET', '/mitre/tactics', {});
  });

  it('opens related items in the Intelligence tab and the findings in Findings', async () => {
    mockApi({ T1110: BRUTE_FORCE });
    const openDiscover = jest.fn();
    renderFlyout('T1110', openDiscover);

    fireEvent.click(await screen.findByText('Password Policies'));
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        tabView: 'intelligence',
        tabRedirect: 'mitigations',
        idToRedirect: 'M1027',
      }),
    );

    fireEvent.click(screen.getByText('Open in Findings'));
    expect(openDiscover).toHaveBeenCalledWith(expect.anything(), 'T1110');
  });

  it('links a sub-technique to its parent', async () => {
    mockApi({
      'T1110.001': {
        ...BRUTE_FORCE,
        external_id: 'T1110.001',
        name: 'Guessing',
      },
      T1110: BRUTE_FORCE,
    });
    renderFlyout('T1110.001');

    expect(await screen.findByText('Sub-technique of')).toBeTruthy();
    expect(await screen.findByText('Brute Force')).toBeTruthy();
  });

  it('warns when the technique is deprecated', async () => {
    mockApi({ T1110: { ...BRUTE_FORCE, deprecated: 1 } });
    renderFlyout('T1110');

    expect(
      await screen.findByText('This technique is deprecated.'),
    ).toBeTruthy();
  });

  it('says when the related names fail and keeps the rest', async () => {
    mockApi({ T1110: BRUTE_FORCE });
    const defaultImplementation = apiReq.getMockImplementation()!;
    apiReq.mockImplementation(async (method, path: string, options) => {
      if (path.startsWith('/mitre/mitigations')) {
        throw new Error('Request failed');
      }
      return defaultImplementation(method, path, options);
    });
    renderFlyout('T1110');

    expect(
      await screen.findByText('The names could not be loaded.'),
    ).toBeTruthy();
    expect(screen.getByText('Mitigations (4)')).toBeTruthy();
    expect(screen.getByText('Credential Access')).toBeTruthy();
  });

  it('keeps the stats and findings when the technique request fails', async () => {
    mockApi({ T1110: new Error('Request failed') });
    renderFlyout('T1110');

    expect(
      await screen.findByText('Error obtaining the requested technique'),
    ).toBeTruthy();
    expect(screen.getByText('findings table')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('175')).toBeTruthy());
  });
});
