jest.mock('../../plugin-services', () => ({
  getCore: () => ({
    application: {
      currentAppId$: jest.requireActual('rxjs').of('cti-feed'),
      getUrlForApp: (appId: string) => `/app/${appId}`,
      navigateToUrl: jest.fn(),
    },
  }),
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

jest.mock('./hooks/use-cti-consumers', () => ({
  useCtiConsumers: () => ({
    consumers: [],
    summary: 'upToDate',
    loading: false,
    refreshing: false,
    error: null,
    refetch: jest.fn(),
    refetchAfterCheck: jest.fn(),
  }),
}));

jest.mock('./hooks/use-feed-content-counts', () => ({
  useFeedContentCounts: () => ({
    counts: {
      rules: 1,
      decoders: 1,
      integrations: 1,
      kvdbs: 1,
      iocs: 891664,
      vulnerabilities: 417402,
    },
    loading: false,
    refetch: jest.fn(),
  }),
}));

jest.mock(
  '../../shared-components/cti-registration/hooks/use-cti-registration-modal',
  () => ({
    useCtiRegistrationModal: () => ({
      isModalOpen: false,
      statusCTI: {},
      loading: false,
      deviceFlowActive: false,
    }),
  }),
);

jest.mock('./subscription-panel', () => ({ SubscriptionPanel: () => null }));
jest.mock('./feed-sync-panel', () => ({ FeedSyncPanel: () => null }));
jest.mock('./check-for-updates-about', () => ({
  CheckForUpdatesAbout: () => null,
}));
jest.mock('./check-for-updates-button', () => ({
  CheckForUpdatesButton: () => null,
}));

jest.mock('./catalog/indicators-tab', () => ({
  IndicatorsTab: ({
    onOpenVulnerability,
  }: {
    onOpenVulnerability: (id: string) => void;
  }) => (
    <button
      data-test-subj='mockIndicatorsTab'
      onClick={() => onOpenVulnerability('CVE-2021-44228')}
    />
  ),
}));

jest.mock('./catalog/vulnerabilities-tab', () => ({
  VulnerabilitiesTab: ({
    lookupRequest,
  }: {
    lookupRequest?: { id: string };
  }) => <div data-test-subj='mockVulnerabilitiesTab'>{lookupRequest?.id}</div>,
}));

import React from 'react';
import {
  act,
  configure,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { createMemoryHistory } from 'history';
import type { ScopedHistory } from 'opensearch-dashboards/public';
import { CtiFeedApp } from './cti-feed-app';

configure({ testIdAttribute: 'data-test-subj' });

const renderApp = (path = '/') => {
  const history = createMemoryHistory({ initialEntries: [path] });
  render(<CtiFeedApp history={history as unknown as ScopedHistory} />);
  return history;
};

describe('CtiFeedApp tabs', () => {
  test('opens on the overview and loads no catalog until asked', () => {
    renderApp();

    expect(screen.getByTestId('ctiFeedOverview')).toBeVisible();
    expect(screen.queryByTestId('mockIndicatorsTab')).toBeNull();
    expect(screen.queryByTestId('mockVulnerabilitiesTab')).toBeNull();
  });

  test('keeps the open tab in the URL', async () => {
    const history = renderApp();

    fireEvent.click(screen.getByTestId('ctiFeedTab-indicators'));

    expect(history.location.search).toBe('?tab=indicators');
    expect(await screen.findByTestId('mockIndicatorsTab')).toBeVisible();
    expect(screen.getByTestId('ctiFeedOverview')).not.toBeVisible();
  });

  test('opens the tab the URL names and follows history', async () => {
    const history = renderApp('/?tab=vulnerabilities');

    expect(await screen.findByTestId('mockVulnerabilitiesTab')).toBeVisible();

    act(() => history.push('/?tab=overview'));
    expect(screen.getByTestId('ctiFeedOverview')).toBeVisible();
    // Already opened: stays mounted, so its state survives the switch.
    expect(screen.getByTestId('mockVulnerabilitiesTab')).not.toBeVisible();
  });

  test('opens the catalog from its count on the overview', async () => {
    renderApp();

    fireEvent.click(screen.getByTestId('ctiFeedContentStat-iocs-link'));

    expect(await screen.findByTestId('mockIndicatorsTab')).toBeVisible();
  });

  test('hands a vulnerability id from the indicators tab over', async () => {
    renderApp('/?tab=indicators');

    fireEvent.click(await screen.findByTestId('mockIndicatorsTab'));

    const vulnerabilities = await screen.findByTestId('mockVulnerabilitiesTab');
    expect(vulnerabilities).toHaveTextContent('CVE-2021-44228');
    expect(vulnerabilities).toBeVisible();
  });
});
