jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
}));

jest.mock('../../services/cti-feed', () => ({
  requestCtiContentUpdate: jest.fn(),
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
import { getCore } from '../../plugin-services';
import { requestCtiContentUpdate } from '../../services/cti-feed';
import { CheckForUpdatesButton } from './check-for-updates-button';

configure({ testIdAttribute: 'data-test-subj' });

const mockRequest = requestCtiContentUpdate as jest.Mock;
const addSuccess = jest.fn();
const addError = jest.fn();

describe('CheckForUpdatesButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      notifications: { toasts: { addSuccess, addError } },
    });
  });

  test('requests a check, reports the update running and reads the sync state', async () => {
    mockRequest.mockResolvedValue(undefined);
    const onRequested = jest.fn();
    const onUpdateRunning = jest.fn();
    render(
      <CheckForUpdatesButton
        onRequested={onRequested}
        onUpdateRunning={onUpdateRunning}
      />,
    );

    fireEvent.click(screen.getByTestId('ctiFeedCheckForUpdatesButton'));

    await waitFor(() => expect(onRequested).toHaveBeenCalledTimes(1));
    expect(onUpdateRunning).toHaveBeenCalledTimes(1);
    expect(addSuccess).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId('ctiFeedCheckForUpdatesButtonInProgressTooltip'),
    ).toBeNull();
  });

  test('is disabled, with an explanation, while an update is in progress', async () => {
    render(<CheckForUpdatesButton onRequested={jest.fn()} updateInProgress />);

    const button = screen.getByTestId('ctiFeedCheckForUpdatesButton');
    expect(button).toBeDisabled();
    // A disabled button gets no mouse events: the tooltip listens on its anchor.
    fireEvent.mouseOver(button.parentElement as HTMLElement);
    expect(
      await screen.findByText(/A content update is in progress/),
    ).toBeInTheDocument();
  });

  test('shows an update already running as running, not as an error', async () => {
    mockRequest.mockRejectedValue({
      response: { status: 409 },
      body: { message: 'A content update is already in progress.' },
    });
    const onRequested = jest.fn();
    const onUpdateRunning = jest.fn();
    render(
      <CheckForUpdatesButton
        onRequested={onRequested}
        onUpdateRunning={onUpdateRunning}
      />,
    );

    fireEvent.click(screen.getByTestId('ctiFeedCheckForUpdatesButton'));

    await waitFor(() => expect(onRequested).toHaveBeenCalledTimes(1));
    expect(onUpdateRunning).toHaveBeenCalledTimes(1);
    expect(addError).not.toHaveBeenCalled();
    expect(addSuccess).not.toHaveBeenCalled();
  });

  test('reports any other failure as an error', async () => {
    mockRequest.mockRejectedValue({ response: { status: 500 } });
    const onRequested = jest.fn();
    const onUpdateRunning = jest.fn();
    render(
      <CheckForUpdatesButton
        onRequested={onRequested}
        onUpdateRunning={onUpdateRunning}
      />,
    );

    fireEvent.click(screen.getByTestId('ctiFeedCheckForUpdatesButton'));

    await waitFor(() => expect(addError).toHaveBeenCalledTimes(1));
    expect(onRequested).not.toHaveBeenCalled();
    expect(onUpdateRunning).not.toHaveBeenCalled();
  });
});
