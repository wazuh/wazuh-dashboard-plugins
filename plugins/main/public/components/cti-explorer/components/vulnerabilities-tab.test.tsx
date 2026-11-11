import '@testing-library/jest-dom';
import React, { useState } from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import type {
  CveSeverityFilter,
  VulnerabilityRecordType,
} from '../../../../common/cti-explorer/constants';
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

jest.mock('../utils/navigation', () => ({
  getCtiCveUrl: (id: string) => `https://cti.example/cves/${id}`,
}));

const mockSearch = searchVulnerabilities as jest.Mock;

/** The tab with its severities kept as the page keeps them. */
const Tab = ({
  type,
  initialSeverities = [],
  onOpenVulnerability = jest.fn(),
}: {
  type: VulnerabilityRecordType | undefined;
  initialSeverities?: CveSeverityFilter[];
  onOpenVulnerability?: (id: string) => void;
}) => {
  const [severities, setSeverities] = useState(initialSeverities);
  return (
    <VulnerabilitiesTab
      summary={{ data: null, loading: false, error: null, reload: jest.fn() }}
      type={type}
      onTypeChange={jest.fn()}
      severities={severities}
      onSeveritiesChange={setSeverities}
      onOpenVulnerability={onOpenVulnerability}
    />
  );
};

const renderTab = (type: VulnerabilityRecordType | undefined) => (
  <Tab type={type} />
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

  it('filters the list by a full id instead of opening the record', async () => {
    const onOpenVulnerability = jest.fn();
    render(<Tab type={undefined} onOpenVulnerability={onOpenVulnerability} />);
    const input = screen.getByTestId('ctiExplorerVulnerabilityIdInput');
    const search = (value: string) => {
      fireEvent.change(input, { target: { value } });
      fireEvent.keyUp(input, { key: 'Enter' });
    };

    search(' cve-2024-6387 ');
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({ id: 'CVE-2024-6387', page: 0 }),
    );
    expect(onOpenVulnerability).not.toHaveBeenCalled();

    // A partial id is rejected and the applied filter is kept.
    const requests = mockSearch.mock.calls.length;
    search('CVE-2024');
    expect(
      await screen.findByText(/Enter a full record id/),
    ).toBeInTheDocument();
    expect(mockSearch.mock.calls).toHaveLength(requests);

    // An empty search lists every record again.
    search('');
    await waitFor(() => expect(lastRequest().id).toBeUndefined());
  });

  it('opens filtered by the severities the page selected', async () => {
    const { container } = render(
      <Tab type='CVE' initialSeverities={['critical']} />,
    );
    await waitFor(() =>
      expect(lastRequest()).toMatchObject({
        type: 'CVE',
        severities: ['critical'],
      }),
    );
    // The selection shows in the filter.
    expect(
      container.querySelectorAll('.euiComboBoxPill, .ouiComboBoxPill'),
    ).toHaveLength(1);
  });

  it('shows the Type column only while both types are listed', async () => {
    mockSearch.mockResolvedValue({
      total: 1,
      items: [{ id: 'CVE-2024-6387', type: 'CVE', offset: 1, document: {} }],
    });
    const header = () =>
      screen.getAllByRole('columnheader').map(cell => cell.textContent?.trim());

    const { rerender } = render(renderTab(undefined));
    await screen.findByText('CVE-2024-6387');
    expect(header()).toContain('Type');

    rerender(renderTab('CVE'));
    await waitFor(() => expect(lastRequest()).toMatchObject({ type: 'CVE' }));
    await screen.findByText('CVE-2024-6387');
    expect(header()).not.toContain('Type');
  });

  it('links the full advisory on the CTI site only while CVE records are listed', async () => {
    mockSearch.mockResolvedValue({
      total: 1,
      items: [{ id: 'CVE-2024-6387', type: 'CVE', offset: 1, document: {} }],
    });
    const onOpenVulnerability = jest.fn();

    const { rerender } = render(
      <Tab type={undefined} onOpenVulnerability={onOpenVulnerability} />,
    );
    await screen.findByText('CVE-2024-6387');
    expect(
      screen.queryByTestId('ctiExplorerVulnerabilityOpenInCti'),
    ).toBeNull();

    rerender(<Tab type='CVE' onOpenVulnerability={onOpenVulnerability} />);
    const advisory = await screen.findByTestId(
      'ctiExplorerVulnerabilityOpenInCti',
    );
    expect(advisory).toHaveAttribute(
      'href',
      'https://cti.example/cves/CVE-2024-6387',
    );
    expect(advisory).toHaveAttribute('target', '_blank');
    // An icon only: its label names the record and the site.
    expect(advisory).toHaveAttribute(
      'aria-label',
      'Full advisory of CVE-2024-6387 on cti.wazuh.com, in a new tab',
    );

    // Following the link does not open the record in the flyout too.
    fireEvent.click(advisory);
    expect(onOpenVulnerability).not.toHaveBeenCalled();

    rerender(<Tab type='TID' onOpenVulnerability={onOpenVulnerability} />);
    await waitFor(() => expect(lastRequest()).toMatchObject({ type: 'TID' }));
    expect(
      screen.queryByTestId('ctiExplorerVulnerabilityOpenInCti'),
    ).toBeNull();
  });
});
