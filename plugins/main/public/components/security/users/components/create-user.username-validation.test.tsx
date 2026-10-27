import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateUser } from './create-user';
import UsersServices from '../services';

type MockNode = { children?: React.ReactNode };

interface MockButtonProps {
  buttonType?: string;
  onChange?: (event: { target: { checked: boolean } }) => void;
  onClick?: () => void;
  isDisabled?: boolean;
  children?: React.ReactNode;
}

interface MockFieldProps {
  placeholder?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  EuiComboBox: () => <div />,
  EuiFieldPassword: ({ placeholder, value, onChange }: MockFieldProps) => (
    <input
      type='password'
      aria-label={placeholder}
      value={value}
      onChange={onChange}
    />
  ),
  EuiFieldText: ({ placeholder, value, onChange }: MockFieldProps) => (
    <input aria-label={placeholder} value={value} onChange={onChange} />
  ),
  EuiOverlayMask: ({ children }: MockNode) => <div>{children}</div>,
  EuiPanel: ({ children }: MockNode) => <div>{children}</div>,
  EuiConfirmModal: ({ children }: MockNode) => <div>{children}</div>,
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

// The debounce only delays the same validation; running it inline keeps the
// test deterministic without changing what is being asserted.
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
    CreateUser: jest.fn(),
    AddUserRoles: jest.fn(),
    UpdateAllowRunAs: jest.fn(),
  },
}));

jest.mock('../../../../react-services/error-handler', () => ({
  ErrorHandler: { info: jest.fn(), warning: jest.fn() },
}));

const mockHandleError = jest.fn();

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: mockHandleError }),
}));

const VALID_PASSWORD = 'Aa1!aaaaaaaa';

const fillForm = async (username: string) => {
  fireEvent.change(screen.getByLabelText('User name'), {
    target: { value: username },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: VALID_PASSWORD },
  });
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: VALID_PASSWORD },
  });
  await waitFor(() => expect(screen.getByLabelText('apply')).toBeTruthy());
};

describe('CreateUser user name validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (UsersServices.CreateUser as jest.Mock).mockResolvedValue({ id: 100 });
  });

  // The Server API accepts `[A-Za-z0-9._-]` only, so a name the form lets
  // through is a request that can only come back as a 400.
  it.each([
    [' abcd', 'a leading space'],
    ['abcd ', 'a trailing space'],
    ['ab#d', 'a character the Server API rejects'],
  ])('does not submit %s (%s)', async (username: string) => {
    render(<CreateUser closeFlyout={jest.fn()} />);

    await fillForm(username);
    fireEvent.click(screen.getByLabelText('apply'));

    await waitFor(() =>
      expect(UsersServices.CreateUser).not.toHaveBeenCalled(),
    );
  });

  it('submits a name the Server API accepts', async () => {
    render(<CreateUser closeFlyout={jest.fn()} />);

    await fillForm('audit-usr-01');
    fireEvent.click(screen.getByLabelText('apply'));

    await waitFor(() =>
      expect(UsersServices.CreateUser).toHaveBeenCalledWith({
        username: 'audit-usr-01',
        password: VALID_PASSWORD,
      }),
    );
  });
});
