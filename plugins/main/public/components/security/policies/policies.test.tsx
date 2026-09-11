import React from 'react';
import { render, screen } from '@testing-library/react';
import { Policies } from './policies';

type MockNode = { children?: React.ReactNode };

jest.mock('@elastic/eui', () => ({
  EuiPageContent: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeader: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeaderSection: ({ children }: MockNode) => (
    <div>{children}</div>
  ),
  EuiPageContentBody: ({ children }: MockNode) => <div>{children}</div>,
  EuiButton: ({ children }: MockNode) => <button>{children}</button>,
  EuiTitle: ({ children }: MockNode) => <div>{children}</div>,
  EuiText: ({ children }: MockNode) => <div>{children}</div>,
}));
jest.mock('./policies-table', () => ({
  PoliciesTable: () => <div data-test-subj='policies-table' />,
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
jest.mock('./services/get-policies.service', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./edit-policy', () => ({ EditPolicyFlyout: () => <div /> }));
jest.mock('./create-policy', () => ({ CreatePolicyFlyout: () => <div /> }));
jest.mock('../../common/hocs', () => ({
  withUserAuthorizationPrompt: () => (Component: unknown) => Component,
}));
jest.mock('../../common/permissions/button', () => ({
  WzButtonPermissions: ({ children }: MockNode) => <button>{children}</button>,
}));

describe('Policies', () => {
  it('shows a description clarifying these policies belong to the Wazuh manager API', () => {
    render(<Policies />);

    expect(
      screen.getByText(/Manage the policies of the manager API/),
    ).toBeTruthy();
  });
});
