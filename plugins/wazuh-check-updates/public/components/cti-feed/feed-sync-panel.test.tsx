/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
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
import { getFeedSyncSummary } from '../../services/cti-consumer-sync-state';
import { FeedSyncPanel } from './feed-sync-panel';

configure({ testIdAttribute: 'data-test-subj' });

const consumer = (overrides: Partial<CtiConsumer> = {}): CtiConsumer => ({
  name: 'public-ruleset-5',
  context: 'rc2-t1-ruleset-5',
  type: 'cti:catalog:consumer:ruleset',
  resource: 'https://example.test/consumer',
  is_public: true,
  status: 'ready',
  local_offset: 10,
  remote_offset: 10,
  ...overrides,
});

const renderPanel = (
  consumers: CtiConsumer[],
  props: Partial<React.ComponentProps<typeof FeedSyncPanel>> = {},
) => {
  const onRefresh = jest.fn();
  const onUpdateRequested = jest.fn();
  const ui = (nextConsumers: CtiConsumer[]) => (
    <FeedSyncPanel
      consumers={nextConsumers}
      summary={getFeedSyncSummary(nextConsumers)}
      loading={false}
      refreshing={false}
      error={null}
      onRefresh={onRefresh}
      onUpdateRequested={onUpdateRequested}
      {...props}
    />
  );
  const { rerender } = render(ui(consumers));
  return {
    onRefresh,
    onUpdateRequested,
    rerender: (nextConsumers: CtiConsumer[]) => rerender(ui(nextConsumers)),
  };
};

describe('FeedSyncPanel', () => {
  test('shows a placeholder while loading', () => {
    renderPanel([], { loading: true });

    expect(screen.getByTestId('ctiFeedSyncLoading')).toBeInTheDocument();
  });

  test('says every feed is up to date and lists them in order', () => {
    renderPanel([
      consumer({
        name: 'public-vulnerabilities-5',
        type: 'cti:catalog:consumer:vulnerabilities',
      }),
      consumer(),
      consumer({ name: 'public-iocs-5', type: 'cti:catalog:consumer:iocs' }),
    ]);

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'All feeds are up to date',
    );
    const rows = screen.getAllByTestId('ctiFeedSyncRow');
    expect(rows.map(row => row.textContent)).toEqual([
      expect.stringContaining('Ruleset'),
      expect.stringContaining('Indicators of compromise'),
      expect.stringContaining('Vulnerabilities'),
    ]);
    screen
      .getAllByTestId('ctiFeedSyncBadge')
      .forEach(badge => expect(badge).toHaveTextContent('Up to date'));
  });

  test('shows the progress of a feed that is syncing', () => {
    renderPanel([
      consumer({ status: 'running', local_offset: 40, remote_offset: 80 }),
    ]);

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'Syncing new content',
    );
    expect(screen.getByTestId('ctiFeedSyncBadge')).toHaveTextContent('Syncing');
    expect(screen.getByTestId('ctiFeedSyncProgress')).toHaveAttribute(
      'value',
      '50',
    );
    expect(screen.getByText('50% synced')).toBeInTheDocument();
  });

  test('flags a feed that failed to sync', () => {
    renderPanel([consumer(), consumer({ status: 'failed', type: 'other' })]);

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'Some feeds could not sync',
    );
    expect(screen.getByText('Sync failed')).toBeInTheDocument();
  });

  test('says when new content is waiting for the next sync', () => {
    renderPanel([consumer({ local_offset: 5 })]);

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'New content is available',
    );
    expect(screen.getByTestId('ctiFeedSyncBadge')).toHaveTextContent(
      'Update available',
    );
  });

  test('explains the empty state before the first sync', () => {
    renderPanel([]);

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'No feed content yet',
    );
    expect(screen.queryByTestId('ctiFeedSyncRow')).toBeNull();
  });

  test('offers a retry when the sync state cannot be read', () => {
    const { onRefresh } = renderPanel([], { error: 'Forbidden' });

    expect(screen.getByTestId('ctiFeedSyncError')).toHaveTextContent(
      'Forbidden',
    );
    fireEvent.click(screen.getByText('Retry'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('opens the details of a feed from its row', async () => {
    renderPanel([
      consumer(),
      consumer({
        name: 'public-iocs-5',
        type: 'cti:catalog:consumer:iocs',
        status: 'failed',
      }),
    ]);

    expect(screen.queryByTestId('ctiFeedDetailsFlyout')).toBeNull();
    const [, iocsRow] = screen.getAllByTestId('ctiFeedSyncRow');
    expect(iocsRow.tagName).toBe('BUTTON');
    fireEvent.click(iocsRow);

    const flyout = screen.getByTestId('ctiFeedDetailsFlyout');
    expect(flyout).toHaveTextContent('Indicators of compromise');
    expect(screen.getByTestId('ctiFeedDetailsState')).toHaveTextContent(
      'The last sync failed',
    );

    fireEvent.click(screen.getByTestId('ctiFeedDetailsClose'));
    await waitFor(() =>
      expect(screen.queryByTestId('ctiFeedDetailsFlyout')).toBeNull(),
    );
  });

  test('keeps the open details in step with the latest read', () => {
    const { rerender } = renderPanel([
      consumer({ status: 'running', local_offset: 40, remote_offset: 80 }),
    ]);
    fireEvent.click(screen.getByTestId('ctiFeedSyncRow'));
    expect(screen.getByTestId('ctiFeedDetailsBadge')).toHaveTextContent(
      'Syncing',
    );

    rerender([consumer({ local_offset: 80, remote_offset: 80 })]);

    expect(screen.getByTestId('ctiFeedDetailsBadge')).toHaveTextContent(
      'Up to date',
    );
  });

  test('closes the details when the feed is no longer reported', () => {
    const { rerender } = renderPanel([consumer()]);
    fireEvent.click(screen.getByTestId('ctiFeedSyncRow'));
    expect(screen.getByTestId('ctiFeedDetailsFlyout')).toBeInTheDocument();

    rerender([]);

    expect(screen.queryByTestId('ctiFeedDetailsFlyout')).toBeNull();
  });

  test('shows when each feed was last updated, or a dash if not reported', () => {
    renderPanel([
      consumer({ updated_at: new Date(Date.now() - 5 * 60000).toISOString() }),
      consumer({ name: 'public-iocs-5', type: 'cti:catalog:consumer:iocs' }),
    ]);

    const [rulesetRow, iocsRow] = screen.getAllByTestId('ctiFeedSyncRow');
    expect(rulesetRow).toHaveTextContent('Last updated: 5 minutes ago');
    expect(iocsRow).toHaveTextContent('Last updated: -');
  });

  test('refreshes the sync state on demand', () => {
    const { onRefresh } = renderPanel([consumer()]);

    fireEvent.click(screen.getByTestId('ctiFeedSyncRefresh'));

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  test('waits for a read in flight before refreshing again', () => {
    renderPanel([consumer()], { refreshing: true });

    expect(screen.getByTestId('ctiFeedSyncRefresh')).toBeDisabled();
  });
});
