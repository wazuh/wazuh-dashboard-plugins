import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { useRouterSearch } from '../common/hooks/use-router-search';
import { IocsTab } from './components/iocs-tab';
import { CtiExplorer } from './cti-explorer';

const mockUpdateSearchParams = jest.fn();

jest.mock('../../kibana-services', () => ({
  getWazuhCheckUpdatesPlugin: () => ({ CtiFeedSyncStatus: () => null }),
}));
jest.mock('../../react-services/navigation-service', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      updateAndNavigateSearchParams: mockUpdateSearchParams,
    }),
  },
}));
jest.mock('../common/hooks/use-router-search', () => ({
  useRouterSearch: jest.fn(),
}));
jest.mock('./services/cti-explorer-api', () => ({
  fetchIocSummary: jest.fn(() => new Promise(() => undefined)),
  fetchVulnerabilitySummary: jest.fn(() => new Promise(() => undefined)),
}));
// Only the props the page hands to the IOCs tab matter here.
jest.mock('./components/iocs-tab', () => ({ IocsTab: jest.fn(() => null) }));
jest.mock('./components/about-cti-explorer', () => ({
  AboutCtiExplorer: () => null,
}));
jest.mock('./components/overview-tab', () => ({ OverviewTab: () => null }));
jest.mock('./components/vulnerabilities-tab', () => ({
  VulnerabilitiesTab: () => null,
}));
jest.mock('./components/ioc-flyout', () => ({ IocFlyout: () => null }));
jest.mock('./components/vulnerability-flyout', () => ({
  VulnerabilityFlyout: () => null,
}));

const mockSearch = useRouterSearch as jest.Mock;
const mockIocsTab = IocsTab as unknown as jest.Mock;

/** Props of every render of the IOCs tab, in order. */
const iocsTabRenders = () => mockIocsTab.mock.calls.map(([props]) => props);

describe('CtiExplorer', () => {
  beforeEach(() => {
    mockUpdateSearchParams.mockReset();
    mockIocsTab.mockClear();
  });

  it('opens the IOC list filtered to the linked type and scrolled into view', () => {
    mockSearch.mockReturnValue({ tab: 'iocs', iocType: 'url_domain' });
    render(<CtiExplorer />);

    // The first search already carries the filter.
    expect(iocsTabRenders()[0]).toMatchObject({
      filters: { type: 'url_domain' },
      scrollToList: true,
    });
    // Applied once: the param leaves the URL without a new history entry.
    expect(mockUpdateSearchParams).toHaveBeenCalledWith(
      { iocType: null },
      { replace: true },
    );
  });

  it('ignores a linked value that is not an IOC type', () => {
    mockSearch.mockReturnValue({ tab: 'iocs', iocType: 'not_a_type' });
    render(<CtiExplorer />);

    expect(iocsTabRenders().pop()).toMatchObject({
      filters: {},
      scrollToList: false,
    });
    expect(mockUpdateSearchParams).toHaveBeenCalledWith(
      { iocType: null },
      { replace: true },
    );
  });

  it('opens the IOC list with no filter and leaves the URL alone with no link', () => {
    mockSearch.mockReturnValue({ tab: 'iocs' });
    render(<CtiExplorer />);

    expect(iocsTabRenders().pop()).toMatchObject({
      filters: {},
      scrollToList: false,
    });
    expect(mockUpdateSearchParams).not.toHaveBeenCalled();
  });
});
