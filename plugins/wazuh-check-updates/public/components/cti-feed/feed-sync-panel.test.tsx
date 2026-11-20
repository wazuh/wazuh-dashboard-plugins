/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: () => ({
    application: {
      currentAppId$: { subscribe: () => ({ unsubscribe: () => undefined }) },
      getUrlForApp: (appId: string, { path = '' } = {}) =>
        `/app/${appId}${path}`,
      navigateToUrl: jest.fn(),
    },
  }),
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

  test('names the catalog each feed comes from', () => {
    renderPanel([
      consumer({ name: 'private-ruleset-5', is_public: false }),
      consumer({ name: 'public-iocs-5', type: 'cti:catalog:consumer:iocs' }),
    ]);

    expect(
      screen.getAllByTestId('ctiFeedCatalog').map(label => label.textContent),
    ).toEqual(['Professional catalog', 'Open catalog']);
  });

  test('says an update is in progress before any feed shows it', () => {
    renderPanel([consumer()], { updateInProgress: true });

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'Content update in progress',
    );
  });

  test('lets a failed feed lead over an update known to be running', () => {
    renderPanel([consumer({ status: 'failed' })], { updateInProgress: true });

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'Some feeds could not sync',
    );
  });

  test('shows what each feed delivered under its row', () => {
    renderPanel([consumer()], {
      contentCounts: {
        rules: 603,
        decoders: 524,
        integrations: 132,
        kvdbs: 49,
        iocs: 952987,
        vulnerabilities: 423061,
      },
    });

    const row = screen.getByTestId('ctiFeedSyncRowContainer');
    expect(row).toHaveTextContent(
      'Delivered: 603 rules · 524 decoders · 132 integrations · 49 KVDBs',
    );
    // The counts are links of their own, outside the part that opens the details.
    expect(screen.getByTestId('ctiFeedSyncRow')).not.toContainElement(
      screen.getByTestId('ctiFeedContentCount-rules'),
    );
  });

  test('warns about sync steps waiting to be retried', () => {
    renderPanel([
      consumer({ pending_sync_phases: ['detectors'] }),
      consumer({ name: 'public-iocs-5', type: 'cti:catalog:consumer:iocs' }),
    ]);

    expect(screen.getByTestId('ctiFeedSyncSummaryTitle')).toHaveTextContent(
      'Some sync steps are waiting to be retried',
    );
    expect(
      screen.getAllByTestId('ctiFeedSyncBadge').map(badge => badge.textContent),
    ).toEqual(['Retry pending', 'Up to date']);
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

  describe('line under a feed row', () => {
    const COUNTS = {
      rules: 603,
      decoders: 524,
      integrations: 132,
      kvdbs: 49,
      iocs: 952987,
      vulnerabilities: 423061,
    };

    test('shows the progress instead of the counts while the feed syncs', () => {
      renderPanel(
        [
          consumer({ status: 'running', local_offset: 40, remote_offset: 80 }),
          consumer({
            name: 'public-iocs-5',
            type: 'cti:catalog:consumer:iocs',
          }),
        ],
        { contentCounts: COUNTS },
      );

      const [ruleset, iocs] = screen.getAllByTestId('ctiFeedSyncRowContainer');
      // The syncing feed: its counts are about to change.
      expect(ruleset).toContainElement(
        screen.getByTestId('ctiFeedSyncProgress'),
      );
      expect(ruleset).not.toHaveTextContent('Delivered');
      // The feed that is up to date keeps its counts.
      expect(iocs).toHaveTextContent('Delivered: 952,987 IOCs');
    });

    test('shows an indeterminate bar when the feed caught up but still runs', () => {
      renderPanel([
        consumer({ status: 'running', local_offset: 80, remote_offset: 80 }),
      ]);

      expect(screen.getByTestId('ctiFeedSyncProgress')).not.toHaveAttribute(
        'value',
      );
      expect(screen.queryByText('100% synced')).toBeNull();
      expect(
        screen.getByTestId('ctiFeedSyncProgressCaption'),
      ).toHaveTextContent('Finishing the sync');
    });

    test('shows an indeterminate bar while the new content is prepared', () => {
      // A plan change: offset 0 until the new snapshot goes live, not 0% done.
      renderPanel([
        consumer({ status: 'running', local_offset: 0, remote_offset: 1899 }),
      ]);

      expect(screen.getByTestId('ctiFeedSyncProgress')).not.toHaveAttribute(
        'value',
      );
      expect(screen.queryByText('0% synced')).toBeNull();
      expect(
        screen.getByTestId('ctiFeedSyncProgressCaption'),
      ).toHaveTextContent('Preparing the new content');
    });

    test('shows an indeterminate bar when the remote offset is unknown', () => {
      renderPanel([
        consumer({ status: 'running', local_offset: 10, remote_offset: 0 }),
      ]);

      expect(screen.getByTestId('ctiFeedSyncProgress')).not.toHaveAttribute(
        'value',
      );
      expect(
        screen.getByTestId('ctiFeedSyncProgressCaption'),
      ).toHaveTextContent('Downloading content');
    });

    test('is left out for a feed with no known content that is not syncing', () => {
      renderPanel([consumer({ type: 'cti:catalog:consumer:other' })], {
        contentCounts: COUNTS,
      });

      expect(
        screen
          .getByTestId('ctiFeedSyncRowContainer')
          .querySelector('.ctiFeed__feedRowFooter'),
      ).toBeNull();
    });
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
