import React from 'react';
import { render, screen } from '@testing-library/react';
import { Users } from './users';

type MockNode = { children?: React.ReactNode };

jest.mock('@elastic/eui', () => ({
  EuiPageContent: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeader: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeaderSection: ({ children }: MockNode) => (
    <div>{children}</div>
  ),
  EuiPageContentBody: ({ children }: MockNode) => <div>{children}</div>,
  EuiTitle: ({ children }: MockNode) => <div>{children}</div>,
  EuiText: ({ children }: MockNode) => <div>{children}</div>,
  EuiEmptyPrompt: () => <div />,
}));
jest.mock('./components/users-table', () => ({
  UsersTable: () => <div data-test-subj='users-table' />,
}));
jest.mock('./components/create-user', () => ({ CreateUser: () => <div /> }));
jest.mock('./components/edit-user', () => ({ EditUser: () => <div /> }));
jest.mock('./services', () => ({ __esModule: true, default: {} }));
jest.mock('../roles/services', () => ({ __esModule: true, default: {} }));
jest.mock('../../common/hooks/useApiService', () => ({
  useApiService: () => [false, [], undefined],
}));
jest.mock('../../common/hooks/usePagination', () => ({
  usePagination: () => ({
    items: [],
    loading: false,
    pageIndex: 0,
    pageSize: 10,
    totalItems: 0,
    getData: jest.fn(),
    refreshCurrentPage: jest.fn(),
    onTableChange: jest.fn(),
    sorting: { sort: {} },
  }),
}));
jest.mock('../../common/hocs', () => ({
  withUserAuthorizationPrompt: () => (Component: unknown) => Component,
}));
jest.mock('../../common/permissions/button', () => ({
  WzButtonPermissions: ({ children }: MockNode) => <button>{children}</button>,
}));

describe('Users', () => {
  it('shows a description clarifying these users belong to the Wazuh manager API', () => {
    render(<Users />);

    expect(
      screen.getByText(/Manage the users of the Wazuh manager API/),
    ).toBeTruthy();
  });
});
