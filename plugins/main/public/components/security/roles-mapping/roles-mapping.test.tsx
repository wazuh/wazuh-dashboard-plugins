import React from 'react';
import { render, screen } from '@testing-library/react';
import { RolesMapping } from './roles-mapping';

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
}));
jest.mock('./components/roles-mapping-table', () => ({
  RolesMappingTable: () => <div data-test-subj='roles-mapping-table' />,
}));
jest.mock('./components/roles-mapping-edit', () => ({
  RolesMappingEdit: () => <div />,
}));
jest.mock('./components/roles-mapping-create', () => ({
  RolesMappingCreate: () => <div />,
}));
jest.mock('../../../react-services/error-handler', () => ({
  ErrorHandler: { handle: jest.fn() },
}));
jest.mock('../../../factories/wazuh-security', () => ({
  WazuhSecurity: jest.fn().mockImplementation(() => ({
    security: { getUsers: jest.fn().mockResolvedValue([]) },
  })),
}));
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
jest.mock('../roles/services', () => ({ __esModule: true, default: {} }));
jest.mock('../rules/services', () => ({
  __esModule: true,
  default: { GetRules: jest.fn() },
}));
jest.mock('react-redux', () => ({ useSelector: () => undefined }));
jest.mock('../../common/hocs', () => ({
  withUserAuthorizationPrompt: () => (Component: unknown) => Component,
}));
jest.mock('../../common/permissions/button', () => ({
  WzButtonPermissions: ({ children }: MockNode) => <button>{children}</button>,
}));

describe('RolesMapping', () => {
  it('shows a description clarifying these mappings belong to the Wazuh manager API', () => {
    render(<RolesMapping />);

    expect(screen.getByText(/Map roles of the Wazuh manager API/)).toBeTruthy();
  });
});
