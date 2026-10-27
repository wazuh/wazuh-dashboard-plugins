/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Users } from './users';
import { WzRequest } from '../../../react-services/wz-request';

type MockNode = { children?: React.ReactNode };

interface MockPromptProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
}

jest.mock('@elastic/eui', () => ({
  EuiPageContent: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeader: ({ children }: MockNode) => <div>{children}</div>,
  EuiPageContentHeaderSection: ({ children }: MockNode) => (
    <div>{children}</div>
  ),
  EuiPageContentBody: ({ children }: MockNode) => <div>{children}</div>,
  EuiTitle: ({ children }: MockNode) => <div>{children}</div>,
  EuiText: ({ children }: MockNode) => <div>{children}</div>,
  EuiEmptyPrompt: ({ title, body }: MockPromptProps) => (
    <div>
      {title}
      {body}
    </div>
  ),
}));
jest.mock('./components/users-table', () => ({
  UsersTable: () => <div data-testid='users-table' />,
}));
jest.mock('./components/create-user', () => ({ CreateUser: () => <div /> }));
jest.mock('./components/edit-user', () => ({ EditUser: () => <div /> }));
jest.mock('../../common/hocs', () => ({
  withUserAuthorizationPrompt: () => (Component: unknown) => Component,
}));
jest.mock('../../common/permissions/button', () => ({
  WzButtonPermissions: () => <button />,
}));
jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const mockHandleError = jest.fn();

jest.mock('../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: mockHandleError }),
}));

const apiReq = WzRequest.apiReq as jest.Mock;

const PERMISSION_TITLE = 'You need permission to manage users';

describe('Users list failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiReq.mockReset();
  });

  // `withUserAuthorizationPrompt` already gates this view on `security:read`,
  // so a failure that reaches the component is a transport or server problem,
  // not a permission one.
  it('does not blame permissions when the users request fails transiently', async () => {
    apiReq.mockImplementation((_method: string, path: string) =>
      path === '/security/users'
        ? Promise.reject(new Error('Network Error'))
        : Promise.resolve({
            data: { data: { affected_items: [], total_affected_items: 0 } },
          }),
    );

    render(<Users />);

    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    expect(screen.queryByText(PERMISSION_TITLE)).toBeNull();
  });

  it('keeps the table mounted so the view can recover', async () => {
    apiReq.mockImplementation((_method: string, path: string) =>
      path === '/security/users'
        ? Promise.reject(new Error('Network Error'))
        : Promise.resolve({
            data: { data: { affected_items: [], total_affected_items: 0 } },
          }),
    );

    render(<Users />);

    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    expect(screen.queryByTestId('users-table')).not.toBeNull();
  });
});
