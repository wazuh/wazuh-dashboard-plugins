import React from 'react';
import { render } from '@testing-library/react';
import { RolesTable } from './roles-table';

interface TableColumn {
  field?: string;
  sortable?: boolean;
}

interface CapturedTableProps {
  columns: TableColumn[];
  sorting: { sort: { field?: string; direction?: string } };
}

type MockNode = { children?: React.ReactNode };

const mockBasicTableProps = {} as CapturedTableProps;

const resetCapturedProps = () => {
  for (const key of Object.keys(mockBasicTableProps)) {
    delete mockBasicTableProps[key as keyof CapturedTableProps];
  }
};

jest.mock('@elastic/eui', () => ({
  EuiBasicTable: (props: CapturedTableProps) => {
    Object.assign(mockBasicTableProps, props);
    return <div data-test-subj='basic-table' />;
  },
  EuiBadge: ({ children }: MockNode) => <span>{children}</span>,
  EuiFlexGroup: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlexItem: ({ children }: MockNode) => <div>{children}</div>,
  EuiToolTip: ({ children }: MockNode) => <div>{children}</div>,
  EuiSpacer: () => <div />,
  EuiLoadingSpinner: () => <div />,
}));
jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));
jest.mock('../../../react-services/error-handler', () => ({
  ErrorHandler: { info: jest.fn() },
}));
jest.mock('../../common/buttons', () => ({
  WzButtonPermissionsModalConfirm: () => <button />,
}));
jest.mock('../../../react-services/wz-api-utils', () => ({
  WzAPIUtils: { isReservedID: () => false },
}));
jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const renderTable = (sorting: CapturedTableProps['sorting']) =>
  render(
    <RolesTable
      roles={[]}
      policiesData={[]}
      loading={false}
      editRole={jest.fn()}
      updateRoles={jest.fn()}
      pageIndex={0}
      pageSize={10}
      totalItems={0}
      onTableChange={jest.fn()}
      sorting={sorting}
    />,
  );

describe('RolesTable', () => {
  beforeEach(resetCapturedProps);

  it('forwards the controlled sorting prop instead of a hardcoded one', () => {
    const sorting = { sort: { field: 'name', direction: 'desc' } };
    renderTable(sorting);

    expect(mockBasicTableProps.sorting).toBe(sorting);
  });

  it('marks only the server-sortable scalar columns as sortable', () => {
    renderTable({ sort: { field: 'id', direction: 'asc' } });

    const sortableFields = mockBasicTableProps.columns
      .filter(column => column.sortable)
      .map(column => column.field);

    expect(sortableFields).toEqual(['id', 'name']);
  });
});
