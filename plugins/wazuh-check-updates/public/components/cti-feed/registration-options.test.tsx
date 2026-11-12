jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
}));

jest.mock('../../services/cti-registration-status', () => ({
  clearCtiRegistration: jest.fn(),
}));

import React from 'react';
import {
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { WAZUH_CTI_CONSOLE_HREF } from '../../../common/constants';
import { getCore } from '../../plugin-services';
import { clearCtiRegistration } from '../../services/cti-registration-status';
import { RegistrationOptions } from './registration-options';

configure({ testIdAttribute: 'data-test-subj' });

const mockedClear = clearCtiRegistration as jest.Mock;
const addSuccess = jest.fn();

const openModal = () => {
  fireEvent.click(screen.getByTestId('ctiFeedRegistrationOptions'));
  fireEvent.click(screen.getByTestId('ctiFeedClearRegistrationAction'));
};

const confirm = () =>
  fireEvent.click(screen.getByTestId('confirmModalConfirmButton'));

describe('RegistrationOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      notifications: { toasts: { addSuccess } },
    });
  });

  test('asks for confirmation before clearing anything', () => {
    render(<RegistrationOptions onCleared={jest.fn()} />);

    openModal();

    expect(
      screen.getByTestId('ctiFeedClearRegistrationModal'),
    ).toBeInTheDocument();
    expect(mockedClear).not.toHaveBeenCalled();
  });

  test('warns that the CTI console registration stays and links to the console', () => {
    render(<RegistrationOptions onCleared={jest.fn()} />);

    openModal();

    const warning = screen.getByTestId('ctiFeedClearRegistrationWarning');
    expect(warning).toHaveTextContent(
      'This does not unregister the environment from the CTI console',
    );
    expect(warning).toHaveTextContent('must be made in the CTI console');
    const link = screen.getByTestId('ctiFeedClearRegistrationConsoleLink');
    expect(link).toHaveAttribute('href', WAZUH_CTI_CONSOLE_HREF);
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('cancelling clears nothing', () => {
    const onCleared = jest.fn();
    render(<RegistrationOptions onCleared={onCleared} />);

    openModal();
    fireEvent.click(screen.getByTestId('confirmModalCancelButton'));

    expect(screen.queryByTestId('ctiFeedClearRegistrationModal')).toBeNull();
    expect(mockedClear).not.toHaveBeenCalled();
    expect(onCleared).not.toHaveBeenCalled();
  });

  test('clears the local registration once confirmed', async () => {
    mockedClear.mockResolvedValue(undefined);
    const onCleared = jest.fn();
    render(<RegistrationOptions onCleared={onCleared} />);

    openModal();
    confirm();

    await waitFor(() => expect(onCleared).toHaveBeenCalledTimes(1));
    expect(mockedClear).toHaveBeenCalledTimes(1);
    expect(addSuccess).toHaveBeenCalledWith(
      'The local registration was cleared.',
    );
    expect(screen.queryByTestId('ctiFeedClearRegistrationModal')).toBeNull();
  });

  test('keeps the modal open with the server message when clearing fails', async () => {
    mockedClear.mockRejectedValue({
      body: { message: 'The indexer could not clear the local registration.' },
    });
    const onCleared = jest.fn();
    render(<RegistrationOptions onCleared={onCleared} />);

    openModal();
    confirm();

    expect(
      await screen.findByTestId('ctiFeedClearRegistrationError'),
    ).toHaveTextContent('The indexer could not clear the local registration.');
    expect(
      screen.getByTestId('ctiFeedClearRegistrationModal'),
    ).toBeInTheDocument();
    expect(onCleared).not.toHaveBeenCalled();
    expect(addSuccess).not.toHaveBeenCalled();
  });
});
