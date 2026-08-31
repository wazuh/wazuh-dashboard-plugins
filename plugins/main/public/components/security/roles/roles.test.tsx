/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { Roles } from './roles';
import { WzRequest } from '../../../react-services/wz-request';

interface TableChange {
  page: { index: number; size: number };
  sort: { field: string; direction: 'asc' | 'desc' };
}

interface CapturedRolesTableProps {
  sorting: { sort: { field?: string; direction?: string } };
  onTableChange: (change: TableChange) => void;
}

type MockNode = { children?: React.ReactNode };

const mockRolesTableProps = {} as CapturedRolesTableProps;

jest.mock('@elastic/eui', () => ({
  EuiPageContent: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeader: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeaderSection: ({ children }: MockNode) => (
    <div>{children}</div>
  ),
  EuiPageContentBody: ({ children }: MockNode) => <div>{children}</div>,
  EuiTitle: ({ children }: MockNode) => <div>{children}</div>,
}));
jest.mock('./roles-table', () => ({
  RolesTable: (props: CapturedRolesTableProps) => {
    Object.assign(mockRolesTableProps, props);
    return <div data-test-subj='roles-table' />;
  },
}));
jest.mock('./create-role', () => ({ CreateRole: () => <div /> }));
jest.mock('./edit-role', () => ({ EditRole: () => <div /> }));
jest.mock('../../common/hocs', () => ({
  withUserAuthorizationPrompt: () => (Component: unknown) => Component,
}));
jest.mock('../../common/permissions/button', () => ({
  WzButtonPermissions: () => <button />,
}));
jest.mock('../../common/flyouts/close-flyout-security', () => ({
  closeFlyout: jest.fn(),
}));
jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

const rolesResponse = {
  data: {
    data: {
      affected_items: [{ id: '1', policies: [] }],
      total_affected_items: 3,
    },
  },
};

const rolesRequests = () =>
  apiReq.mock.calls.filter(call => call[1] === '/security/roles');

describe('Roles', () => {
  beforeEach(() => {
    apiReq.mockReset();
    apiReq.mockResolvedValue(rolesResponse);
    for (const key of Object.keys(mockRolesTableProps)) {
      delete mockRolesTableProps[key as keyof CapturedRolesTableProps];
    }
  });

  it('requests the first page sorted by id ascending by default', async () => {
    render(<Roles />);

    await waitFor(() => expect(rolesRequests()).toHaveLength(1));

    expect(rolesRequests()[0][2]).toEqual({
      params: { offset: 0, limit: 10, sort: '+id' },
    });
    expect(mockRolesTableProps.sorting.sort).toEqual({
      field: 'id',
      direction: 'asc',
    });
  });

  it('refetches with the new sort and resets to the first page on header click', async () => {
    render(<Roles />);
    await waitFor(() => expect(rolesRequests()).toHaveLength(1));

    await act(async () => {
      mockRolesTableProps.onTableChange({
        page: { index: 2, size: 10 },
        sort: { field: 'name', direction: 'desc' },
      });
      await Promise.resolve();
    });

    await waitFor(() => expect(rolesRequests()).toHaveLength(2));

    expect(rolesRequests()[1][2]).toEqual({
      params: { offset: 0, limit: 10, sort: '-name' },
    });
    await waitFor(() =>
      expect(mockRolesTableProps.sorting.sort).toEqual({
        field: 'name',
        direction: 'desc',
      }),
    );
  });
});
