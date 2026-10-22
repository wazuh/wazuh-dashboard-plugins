/* eslint-disable camelcase -- indexer settings fields keep their API names */
jest.mock('../../kibana-services', () => ({
  getToasts: jest.fn(),
}));

jest.mock('../../utils/security-analytics-config', () => ({
  isSecurityAnalyticsSettingDisabled: jest.fn(),
}));

jest.mock('../../react-services', () => ({
  GenericRequest: { request: jest.fn() },
}));

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getToasts } from '../../kibana-services';
import { GenericRequest } from '../../react-services';
import { isSecurityAnalyticsSettingDisabled } from '../../utils/security-analytics-config';
import { WzIndexerSettings } from '.';

const mockRequest = GenericRequest.request as jest.Mock;
const mockIsDisabled = isSecurityAnalyticsSettingDisabled as jest.Mock;
const mockAddDanger = jest.fn();
(getToasts as jest.Mock).mockReturnValue({
  addDanger: mockAddDanger,
  addSuccess: jest.fn(),
});

describe('WzIndexerSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest.mockResolvedValue({
      data: { engine: { index_raw_events: false } },
    });
  });

  test('shows the raw events setting', async () => {
    mockIsDisabled.mockReturnValue(false);

    render(<WzIndexerSettings />);

    expect(
      await screen.findByText('Enable raw events', { selector: 'span' }),
    ).toBeInTheDocument();
    expect(mockRequest).toHaveBeenCalledWith('GET', '/indexer/settings');
  });

  test('no longer offers the CTI content update, which moved to the CTI feed app', async () => {
    mockIsDisabled.mockReturnValue(false);

    render(<WzIndexerSettings />);

    await screen.findByText('Enable raw events', { selector: 'span' });
    expect(screen.queryByText('Update CTI content')).not.toBeInTheDocument();
  });

  test('says there is nothing to configure when raw events is hidden', async () => {
    mockIsDisabled.mockReturnValue(true);

    render(<WzIndexerSettings />);

    expect(
      await screen.findByText(
        'There are no indexer settings available to configure.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Enable raw events')).not.toBeInTheDocument();
  });

  test('reverts a refused change and stops offering it when the user lacks permission', async () => {
    mockIsDisabled.mockReturnValue(false);
    render(<WzIndexerSettings />);

    const toggle = await screen.findByRole('switch');
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();

    mockRequest.mockRejectedValueOnce({ response: { status: 403 } });
    fireEvent.click(screen.getByText('Save changes'));

    const noPermission =
      "You don't have permission to change indexer settings.";
    await waitFor(() =>
      expect(mockAddDanger).toHaveBeenCalledWith(noPermission),
    );
    expect(mockRequest).toHaveBeenLastCalledWith(
      'PUT',
      '/indexer/settings',
      { engine: { index_raw_events: true } },
      true,
    );
    expect(toggle).not.toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.queryByText('Save changes')).not.toBeInTheDocument();
    expect(screen.getByText(noPermission)).toBeInTheDocument();
  });

  test('shows the server message when saving fails for another reason', async () => {
    mockIsDisabled.mockReturnValue(false);
    render(<WzIndexerSettings />);

    const toggle = await screen.findByRole('switch');
    fireEvent.click(toggle);

    mockRequest.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Indexer unavailable' } },
    });
    fireEvent.click(screen.getByText('Save changes'));

    await waitFor(() =>
      expect(mockAddDanger).toHaveBeenCalledWith('Indexer unavailable'),
    );
    expect(toggle).not.toBeDisabled();
  });
});
