/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: jest.fn(),
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
import type { CtiConsumer } from '../../../common/cti-consumers';
import { getCore, getWazuhCore } from '../../plugin-services';
import { requestCtiContentUpdate } from '../../services/cti-feed';
import { FeedDetailsFlyout } from './feed-details-flyout';

configure({ testIdAttribute: 'data-test-subj' });

const mockRequestUpdate = requestCtiContentUpdate as jest.Mock;
const numberFormat = new Intl.NumberFormat();

const consumer = (overrides: Partial<CtiConsumer> = {}): CtiConsumer => ({
  name: 'public-iocs-5',
  context: 't1-iocs-5',
  type: 'cti:catalog:consumer:iocs',
  resource: 'https://example.test/consumer',
  is_public: true,
  status: 'ready',
  local_offset: 989386,
  remote_offset: 989386,
  ...overrides,
});

const renderFlyout = (overrides: Partial<CtiConsumer> = {}) => {
  const onClose = jest.fn();
  const onUpdateRequested = jest.fn();
  render(
    <FeedDetailsFlyout
      consumer={consumer(overrides)}
      onClose={onClose}
      onUpdateRequested={onUpdateRequested}
    />,
  );
  return { onClose, onUpdateRequested };
};

describe('FeedDetailsFlyout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      notifications: {
        toasts: { addSuccess: jest.fn(), addError: jest.fn() },
      },
    });
    (getWazuhCore as jest.Mock).mockReturnValue({
      utils: { formatUIDate: (date: string) => `formatted ${date}` },
    });
  });

  test('names the feed and lists the consumer fields', () => {
    renderFlyout();

    expect(screen.getByTestId('ctiFeedDetailsFlyout')).toHaveTextContent(
      'Indicators of compromise',
    );
    const fields = screen.getByTestId('ctiFeedDetailsFields');
    [
      'public-iocs-5',
      't1-iocs-5',
      'cti:catalog:consumer:iocs',
      'Public',
      'ready',
      numberFormat.format(989386),
    ].forEach(value => expect(fields).toHaveTextContent(value));
    expect(screen.getByTestId('ctiFeedDetailsResource')).toHaveAttribute(
      'href',
      'https://example.test/consumer',
    );
  });

  test('explains an up to date feed', () => {
    renderFlyout();

    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      'This feed is up to date',
    );
    expect(screen.getByTestId('ctiFeedDetailsBadge')).toHaveTextContent(
      'Up to date',
    );
    expect(screen.getByTestId('ctiFeedDetailsBehind')).toHaveTextContent(
      'Nothing left to sync',
    );
  });

  test('explains a failed sync and how far behind the feed is', () => {
    renderFlyout({ status: 'failed', local_offset: 979386 });

    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      'The last sync failed',
    );
    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      'public-iocs-5',
    );
    expect(screen.getByTestId('ctiFeedDetailsBehind')).toHaveTextContent(
      `${numberFormat.format(10000)} changes behind the feed`,
    );
    // Floored: 98.99% stays 98, so a feed that is behind never reads as done.
    expect(screen.getByTestId('ctiFeedDetailsProgress')).toHaveAttribute(
      'value',
      '98',
    );
  });

  test('counts the changes a pending feed is missing', () => {
    renderFlyout({ local_offset: 989385 });

    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      `The feed has ${numberFormat.format(
        1,
      )} change this environment does not have yet`,
    );
  });

  test('shows the raw status it does not recognize', () => {
    renderFlyout({ status: 'paused' });

    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      'The indexer reports the status "paused"',
    );
  });

  test('says when the feed has not published content yet', () => {
    renderFlyout({ local_offset: 0, remote_offset: 0, resource: '' });

    expect(screen.getByTestId('ctiFeedDetailsNoContent')).toBeInTheDocument();
    expect(screen.queryByTestId('ctiFeedDetailsProgress')).toBeNull();
    expect(screen.queryByTestId('ctiFeedDetailsResource')).toBeNull();
  });

  test('checks for updates from the footer', async () => {
    mockRequestUpdate.mockResolvedValue({});
    const { onUpdateRequested } = renderFlyout({ status: 'failed' });

    fireEvent.click(screen.getByTestId('ctiFeedDetailsCheckForUpdatesButton'));

    await waitFor(() => expect(onUpdateRequested).toHaveBeenCalledTimes(1));
    expect(mockRequestUpdate).toHaveBeenCalledTimes(1);
  });

  test('shows when the feed was last updated', () => {
    const updatedAt = new Date(Date.now() - 3 * 3600000).toISOString();
    renderFlyout({ status: 'failed', updated_at: updatedAt });

    expect(screen.getByTestId('ctiFeedDetailsUpdatedAt')).toHaveTextContent(
      'Last updated: 3 hours ago',
    );
    expect(screen.getByTestId('ctiFeedDetailsFields')).toHaveTextContent(
      `Last updatedformatted ${updatedAt}`,
    );
  });

  test('shows a dash when the indexer does not report the update time', () => {
    renderFlyout();

    expect(screen.getByTestId('ctiFeedDetailsUpdatedAt')).toHaveTextContent(
      'Last updated: -',
    );
    expect(screen.getByTestId('ctiFeedDetailsFields')).toHaveTextContent(
      'Last updated-',
    );
  });

  test('does not show the pending sync phases', () => {
    renderFlyout({ pending_sync_phases: ['rules', 'detectors'] });

    const flyout = screen.getByTestId('ctiFeedDetailsFlyout');
    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      'This feed is up to date',
    );
    expect(flyout).not.toHaveTextContent('detectors');
    expect(flyout).not.toHaveTextContent('Pending');
  });

  test('closes from the footer', () => {
    const { onClose } = renderFlyout();

    fireEvent.click(screen.getByTestId('ctiFeedDetailsClose'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
