/* eslint-disable camelcase -- Wazuh Server API response fixtures use snake_case */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EditUser } from './edit-user';
import UsersServices from '../services';
import { ErrorHandler } from '../../../../react-services/error-handler';

type MockNode = { children?: React.ReactNode };

interface MockButtonProps {
  buttonType?: string;
  onChange?: (event: { target: { checked: boolean } }) => void;
  onClick?: () => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
}

jest.mock('@elastic/eui', () => ({
  EuiTitle: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlyoutHeader: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlyoutBody: ({ children }: MockNode) => <div>{children}</div>,
  EuiForm: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlexGroup: ({ children }: MockNode) => <div>{children}</div>,
  EuiFlexItem: ({ children }: MockNode) => <div>{children}</div>,
  EuiFormRow: ({ children }: MockNode) => <div>{children}</div>,
  EuiSpacer: () => <div />,
  EuiBadge: ({ children }: MockNode) => <span>{children}</span>,
  EuiComboBox: () => <div />,
  EuiFieldPassword: () => <input type='password' />,
  EuiOverlayMask: ({ children }: MockNode) => <div>{children}</div>,
  EuiConfirmModal: ({ children }: MockNode) => <div>{children}</div>,
  EuiPanel: ({ children }: MockNode) => <div>{children}</div>,
}));

jest.mock('../../../common/flyouts', () => ({
  WzFlyout: ({ children }: MockNode) => <div>{children}</div>,
}));

jest.mock('../../../common/permissions/button', () => ({
  WzButtonPermissions: ({
    buttonType,
    onChange,
    onClick,
    isDisabled,
    children,
  }: MockButtonProps) =>
    buttonType === 'switch' ? (
      <input
        type='checkbox'
        aria-label='allow-run-as'
        onChange={() => onChange({ target: { checked: true } })}
      />
    ) : (
      <button aria-label='apply' disabled={isDisabled} onClick={onClick}>
        {children}
      </button>
    ),
}));

// The debounce only delays the same work; running it inline keeps the test
// deterministic without changing what is being asserted.
jest.mock('../../../common/hooks/useDebouncedEffect', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useDebouncedEffect: (
      effect: () => void,
      _delay: number,
      deps: unknown[],
      // eslint-disable-next-line react-hooks/exhaustive-deps -- this mock forwards the hook's own deps
    ) => useEffect(effect, deps),
  };
});

jest.mock('../../../common/hooks/useApiService', () => ({
  useApiService: () => [false, [], undefined],
}));

jest.mock('../services', () => ({
  __esModule: true,
  default: {
    UpdateAllowRunAs: jest.fn(),
    UpdateUser: jest.fn(),
    AddUserRoles: jest.fn(),
    RemoveUserRoles: jest.fn(),
  },
}));

jest.mock('../../../../react-services/error-handler', () => ({
  ErrorHandler: { info: jest.fn(), warning: jest.fn() },
}));

const mockHandleError = jest.fn();

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: mockHandleError }),
}));

jest.mock('../../../../react-services/wz-api-utils', () => ({
  WzAPIUtils: { isReservedID: () => false },
}));

const currentUser = {
  id: 100,
  username: 'audit-usr-01',
  roles: [],
  allow_run_as: false,
};

const renderFlyout = (closeFlyout = jest.fn()) => {
  render(
    <EditUser
      currentUser={currentUser}
      closeFlyout={closeFlyout}
      rolesObject={{}}
    />,
  );
  return closeFlyout;
};

describe('EditUser save failures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UsersServices.UpdateAllowRunAs as jest.Mock).mockRejectedValue(
      new Error('Run as is not enabled in the Server API (4005)'),
    );
  });

  it('does not report success when the Server API rejects the update', async () => {
    const closeFlyout = renderFlyout();

    fireEvent.click(screen.getByLabelText('allow-run-as'));
    await waitFor(() =>
      expect(
        (screen.getByLabelText('apply') as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByLabelText('apply'));

    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    expect(ErrorHandler.info).not.toHaveBeenCalled();
    expect(closeFlyout).not.toHaveBeenCalledWith(true);
  });

  it('waits for the pending requests before closing the flyout', async () => {
    let resolveUpdate: (value: unknown) => void = () => {};
    (UsersServices.UpdateAllowRunAs as jest.Mock).mockReturnValue(
      new Promise(resolve => {
        resolveUpdate = resolve;
      }),
    );
    const closeFlyout = renderFlyout();

    fireEvent.click(screen.getByLabelText('allow-run-as'));
    await waitFor(() =>
      expect(
        (screen.getByLabelText('apply') as HTMLButtonElement).disabled,
      ).toBe(false),
    );
    fireEvent.click(screen.getByLabelText('apply'));

    // The list refresh is driven by closeFlyout(true); firing it while the PUT
    // is still in flight refreshes the table with the pre-update values.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(closeFlyout).not.toHaveBeenCalled();

    resolveUpdate({});
    await waitFor(() => expect(closeFlyout).toHaveBeenCalledWith(true));
  });
});
