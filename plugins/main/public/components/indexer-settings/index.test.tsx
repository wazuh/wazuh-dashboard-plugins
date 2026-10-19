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
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GenericRequest } from '../../react-services';
import { isSecurityAnalyticsSettingDisabled } from '../../utils/security-analytics-config';
import { WzIndexerSettings } from '.';

const mockRequest = GenericRequest.request as jest.Mock;
const mockIsDisabled = isSecurityAnalyticsSettingDisabled as jest.Mock;

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
});
