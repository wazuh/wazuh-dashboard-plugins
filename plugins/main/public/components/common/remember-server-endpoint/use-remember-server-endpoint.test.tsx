import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { RememberServerEndpointSwitch } from './remember-server-endpoint-switch';

const mockSet = jest.fn();
const mockDispatch = jest.fn();
const mockHandleError = jest.fn();

jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));

jest.mock('../../../kibana-services', () => ({
  getUiSettings: () => ({ set: mockSet }),
}));

jest.mock(
  '../../../react-services/error-management/error-handler/error-handler',
  () => ({
    ErrorHandler: {
      handleError: (...args: unknown[]) => mockHandleError(...args),
    },
  }),
);

interface FieldState {
  value: string;
  initialValue?: string;
  error?: string;
}

const field = ({ value, initialValue = '', error }: FieldState) =>
  ({ value, initialValue, error } as never);

const renderSwitch = (
  address: FieldState,
  port: FieldState = { value: '' },
  path: FieldState = { value: '' },
) => {
  const ui = (a: FieldState, p: FieldState, f: FieldState) => (
    <RememberServerEndpointSwitch
      address={field(a)}
      port={field(p)}
      path={field(f)}
    />
  );
  const view = render(ui(address, port, path));

  return {
    rerender: (a: FieldState, p: FieldState = port, f: FieldState = path) =>
      view.rerender(ui(a, p, f)),
  };
};

/* The id generator is stubbed in this environment, so an accessible-name query
cannot tell the controls apart: the switch is reached by its test subject. */
const toggle = () =>
  document.querySelector(
    '[data-test-subj="rememberServerEndpoint"]',
  ) as HTMLElement;

beforeEach(() => {
  mockSet.mockReset();
  mockSet.mockResolvedValue(true);
  mockDispatch.mockReset();
  mockHandleError.mockReset();
});

describe('RememberServerEndpointSwitch', () => {
  it('is on while the endpoint is the one saved already', () => {
    renderSwitch({ value: 'a.example', initialValue: 'a.example' });
    expect(toggle()).toBeChecked();
  });

  it('saves the address, the port and the path prefix together', async () => {
    renderSwitch({ value: 'a.example' }, { value: '1517' }, { value: '/wz/' });

    fireEvent.click(toggle());

    await waitFor(() => expect(mockSet).toHaveBeenCalledTimes(3));
    expect(mockSet).toHaveBeenCalledWith('enrollment.dns', 'a.example');
    expect(mockSet).toHaveBeenCalledWith('enrollment.port', '1517');
    expect(mockSet).toHaveBeenCalledWith('enrollment.path', '/wz/');
    await waitFor(() => expect(toggle()).toBeChecked());
  });

  it('updates the app config in the store once saved', async () => {
    renderSwitch({ value: 'a.example' }, { value: '1517' });

    fireEvent.click(toggle());

    await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_APP_CONFIG_DATA',
      payload: {
        'enrollment.dns': 'a.example',
        'enrollment.port': '1517',
        'enrollment.path': '',
      },
    });
  });

  it('goes off when any of the three is edited after saving', async () => {
    const { rerender } = renderSwitch({ value: 'a.example' });
    fireEvent.click(toggle());
    await waitFor(() => expect(toggle()).toBeChecked());

    rerender({ value: 'a.example' }, { value: '443' });

    await waitFor(() => expect(toggle()).not.toBeChecked());
  });

  it('reports a failed save and leaves the switch off', async () => {
    mockSet.mockRejectedValue(new Error('forbidden'));
    renderSwitch({ value: 'a.example' });

    fireEvent.click(toggle());

    await waitFor(() => expect(mockHandleError).toHaveBeenCalled());
    expect(mockDispatch).not.toHaveBeenCalled();
    await waitFor(() => expect(toggle()).not.toBeChecked());
  });

  it('leaves the switch off and the store as it was when a setting is refused', async () => {
    mockSet.mockResolvedValueOnce(true).mockResolvedValue(false);
    renderSwitch({ value: 'a.example' });

    fireEvent.click(toggle());

    await waitFor(() => expect(mockSet).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(toggle()).not.toBeChecked());
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('is disabled without an address or with an invalid field', () => {
    const { rerender } = renderSwitch({ value: '' });
    expect(toggle()).toBeDisabled();

    rerender({ value: 'a.example' }, { value: 'x', error: 'Invalid port' });
    expect(toggle()).toBeDisabled();
  });
});
