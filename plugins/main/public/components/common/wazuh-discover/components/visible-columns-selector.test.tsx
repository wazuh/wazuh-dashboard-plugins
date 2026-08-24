import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { I18nProvider } from '@osd/i18n/react';
import { EuiDataGridColumn } from '@elastic/eui';
import { DataGridVisibleColumnsSelector } from './visible-columns-selector';

const renderComponent = (availableColumns: EuiDataGridColumn[]) =>
  render(
    <I18nProvider>
      <DataGridVisibleColumnsSelector
        availableColumns={availableColumns}
        columnVisibility={{
          visibleColumns: availableColumns.map(({ id }) => id),
          setVisibleColumns: jest.fn(),
        }}
      />
    </I18nProvider>,
  );

const searchColumns = (searchValue: string) => {
  fireEvent.click(screen.getByRole('button'));
  fireEvent.change(screen.getByLabelText('Search columns'), {
    target: { value: searchValue },
  });
};

describe('DataGridVisibleColumnsSelector', () => {
  it('filters the columns by name', () => {
    renderComponent([
      { id: '@timestamp', name: '@timestamp' },
      { id: 'wazuh.rule.level', name: 'wazuh.rule.level' },
    ] as EuiDataGridColumn[]);

    searchColumns('rule');

    expect(screen.getByText('wazuh.rule.level')).toBeInTheDocument();
    expect(screen.queryByText('@timestamp')).not.toBeInTheDocument();
  });

  // Regression test for https://github.com/wazuh/wazuh-dashboard-plugins/issues/8300
  // The module column definitions only declare the field `id`, so the columns
  // reached the selector without a `name` while the index pattern fields were
  // not available yet and filtering them crashed the Events tab.
  it('filters the columns without a name instead of throwing', () => {
    renderComponent([
      { id: '@timestamp' },
      { id: 'wazuh.rule.level' },
    ] as EuiDataGridColumn[]);

    expect(() => searchColumns('rule')).not.toThrow();

    expect(screen.getByText('wazuh.rule.level')).toBeInTheDocument();
    expect(screen.queryByText('@timestamp')).not.toBeInTheDocument();
  });
});
