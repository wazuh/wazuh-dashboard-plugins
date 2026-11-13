import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TableDataGridWithSearchBarInspectedHit } from './table';

const mockExportSearchToCSV = jest.fn();

// EuiDataGrid renders nothing in jsdom (no measured size), so only render its toolbar controls.
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiDataGrid: ({ toolbarVisibility }: any) => (
    <div>{toolbarVisibility?.additionalControls}</div>
  ),
}));

jest.mock('../data-grid', () => ({
  ...jest.requireActual('../data-grid'),
  exportSearchToCSV: (params: any) => mockExportSearchToCSV(params),
  getAllCustomRenders: jest.fn(),
  MAX_ENTRIES_PER_QUERY: 10000,
  useDataGrid: jest.fn(),
}));

jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getWazuhCorePlugin: () => ({ hooks: { useDockedSideNav: () => false } }),
}));

jest.mock('../../../react-services/error-management', () => ({
  ErrorHandler: { handleError: jest.fn() },
  ErrorFactory: { create: jest.fn() },
  HttpError: jest.fn(),
}));

jest.mock(
  '../../../kibana-integrations/discover/application/components/hits_counter',
  () => ({
    HitsCounter: () => null,
  }),
);
jest.mock('../../../kibana-integrations/discover/application/helpers', () => ({
  formatNumWithCommas: (value: number) => String(value),
}));
jest.mock('../loading-searchbar-progress/loading-searchbar-progress', () => ({
  LoadingSearchbarProgress: () => null,
}));
jest.mock('./render-columns', () => ({ wzDiscoverRenderColumns: jest.fn() }));
jest.mock('./components/document-view-table-and-json', () => ({
  DocumentViewTableAndJson: () => null,
}));
jest.mock('./components/visible-columns-selector', () => ({
  DataGridVisibleColumnsSelector: () => null,
}));
jest.mock('./components/restore-state-columns', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../search-bar', () => ({ WzSearchBar: () => null }));
jest.mock('../hooks/use-data-source-search-context', () => ({
  CreateNewSearchContext: jest.fn(),
  useDataSourceWithSearchBar: jest.fn(),
}));
jest.mock('../data-source', () => ({ PatternDataSource: jest.fn() }));
jest.mock('../no-results/no-results', () => ({
  DiscoverNoResults: () => null,
}));
jest.mock('../hooks', () => ({ useEffectEnsureComponentMounted: jest.fn() }));
jest.mock('./table.scss', () => ({}));

const searchBarQuery = { query: 'user.name:root', language: 'lucene' };

const renderTable = (props: object = {}) =>
  render(
    <TableDataGridWithSearchBarInspectedHit
      dataSource={{ indexPattern: { id: 'index-pattern' } }}
      filters={[]}
      fetchFilters={[]}
      fixedFilters={[]}
      setFilters={jest.fn()}
      isDataSourceLoading={false}
      searchBarProps={{ query: searchBarQuery }}
      showSearchBar={false}
      results={{ hits: { total: 3 } }}
      dataGridProps={{
        columnVisibility: { visibleColumns: ['user.name'] },
        sorting: { columns: [] },
        columnsAvailable: [],
        renderCellValue: () => null,
      }}
      {...props}
    />,
  );

describe('TableDataGridWithSearchBarInspectedHit export', () => {
  beforeEach(() => {
    mockExportSearchToCSV.mockReset();
    mockExportSearchToCSV.mockResolvedValue(undefined);
  });

  it('exports using the search bar query when no query prop is provided', async () => {
    renderTable();

    fireEvent.click(screen.getByText('Export Formatted'));

    await waitFor(() =>
      expect(mockExportSearchToCSV).toHaveBeenCalledWith(
        expect.objectContaining({ query: searchBarQuery }),
      ),
    );
  });

  it('prefers the query prop over the search bar query', async () => {
    const query = { query: 'user.name:admin', language: 'kuery' };

    renderTable({ query });

    fireEvent.click(screen.getByText('Export Formatted'));

    await waitFor(() =>
      expect(mockExportSearchToCSV).toHaveBeenCalledWith(
        expect.objectContaining({ query }),
      ),
    );
  });
});
