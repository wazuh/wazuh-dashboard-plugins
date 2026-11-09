import '@testing-library/jest-dom';
import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type { VulnerabilityRecordType } from '../../../../common/cti-explorer/constants';
import { searchVulnerabilities } from '../services/cti-explorer-api';
import { VulnerabilitiesTab } from './vulnerabilities-tab';

configure({ testIdAttribute: 'data-test-subj' });

jest.mock('../services/cti-explorer-api', () => ({
  ...jest.requireActual('../services/cti-explorer-api'),
  searchVulnerabilities: jest.fn(),
}));
// The CSV export reads its row limit from the app settings in the store.
jest.mock('../../common/hooks/use-app-config', () => ({
  useAppConfig: () => ({ data: {} }),
}));

const mockSearch = searchVulnerabilities as jest.Mock;

const renderTab = (type: VulnerabilityRecordType | undefined) => (
  <VulnerabilitiesTab
    summary={{ data: null, loading: false, error: null, reload: jest.fn() }}
    type={type}
    onTypeChange={jest.fn()}
    onOpenVulnerability={jest.fn()}
  />
);

const lastRequest = () =>
  mockSearch.mock.calls[mockSearch.mock.calls.length - 1][0];

describe('VulnerabilitiesTab', () => {
  beforeEach(() => {
    mockSearch.mockReset();
    mockSearch.mockResolvedValue({ total: 0, items: [] });
  });

  it('starts with the most recently published records first', async () => {
    const { rerender } = render(renderTab(undefined));
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({
        sortField: 'document.cveMetadata.datePublished',
        sortDirection: 'desc',
      }),
    );

    // Translation rules have no publication date: delivery order.
    rerender(renderTab('TID'));
    await waitFor(() => expect(lastRequest()).toMatchObject({ type: 'TID' }));
    expect(lastRequest().sortField).toBeUndefined();
  });

  it('clears the severity filter when translation rules are selected', async () => {
    const { container, rerender } = render(renderTab('CVE'));
    // Selected options of the severity filter.
    const pills = () =>
      container.querySelectorAll('.euiComboBoxPill, .ouiComboBoxPill');

    fireEvent.click(screen.getByTestId('comboBoxToggleListButton'));
    fireEvent.click(screen.getByTestId('ctiExplorerSeverityFilter-critical'));
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ severities: ['critical'] }),
    );
    expect(pills()).toHaveLength(1);

    rerender(renderTab('TID'));
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ type: 'TID', severities: [] }),
    );
    // Translation rules have no scores: the filter is hidden.
    expect(
      screen.queryByTestId('ctiExplorerSeverityFilter'),
    ).not.toBeInTheDocument();

    // Back on CVE records, the severity is not restored.
    rerender(renderTab('CVE'));
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ type: 'CVE', severities: [] }),
    );
    // No selected severity left in the filter.
    expect(pills()).toHaveLength(0);
  });
});
