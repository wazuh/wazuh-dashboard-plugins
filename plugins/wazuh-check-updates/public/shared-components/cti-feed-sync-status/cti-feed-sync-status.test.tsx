/* eslint-disable camelcase -- CTI consumer fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: () => ({
    application: {
      // Read by `RedirectAppLinks`.
      currentAppId$: jest.requireActual('rxjs').of('wazuh'),
      getUrlForApp: (appId: string) => `/app/${appId}`,
      navigateToUrl: jest.fn(),
    },
  }),
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

jest.mock('../../components/cti-feed/hooks/use-cti-consumers', () => ({
  useCtiConsumers: jest.fn(),
}));

import React from 'react';
import { configure, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CtiConsumer } from '../../../common/cti-consumers';
import { useCtiConsumers } from '../../components/cti-feed/hooks/use-cti-consumers';
import { CtiFeedSyncStatus, getLastUpdatedAt } from './cti-feed-sync-status';

configure({ testIdAttribute: 'data-test-subj' });

const mockUseCtiConsumers = useCtiConsumers as jest.Mock;

const consumer = (
  feed: string,
  overrides: Partial<CtiConsumer> = {},
): CtiConsumer => ({
  name: `public-${feed}-5`,
  context: `t1-${feed}-5`,
  type: `cti:catalog:consumer:${feed}`,
  resource: 'https://example.test/consumer',
  is_public: true,
  status: 'ready',
  local_offset: 10,
  remote_offset: 10,
  ...overrides,
});

const withConsumers = (
  consumers: CtiConsumer[],
  state: { loading?: boolean; error?: string | null } = {},
) =>
  mockUseCtiConsumers.mockReturnValue({
    consumers,
    lastCheckedAt: '2026-11-08T16:49:21.562Z',
    loading: false,
    error: null,
    ...state,
  });

describe('CtiFeedSyncStatus', () => {
  it('shows the summary and the latest update of the selected feeds', () => {
    withConsumers([
      // Not selected: its newer time and failure are left out.
      consumer('ruleset', {
        status: 'failed',
        updated_at: '2026-11-09T00:00:00.000Z',
      }),
      consumer('iocs', { updated_at: '2026-11-08T16:41:50.265Z' }),
      consumer('vulnerabilities', { updated_at: '2026-11-08T16:42:38.876Z' }),
    ]);
    render(<CtiFeedSyncStatus feeds={['iocs', 'vulnerabilities']} />);

    const status = screen.getByTestId('ctiFeedSyncStatus');
    expect(status).toHaveTextContent('Feeds up to date');
    expect(status).toHaveTextContent(
      '· synced formatted 2026-11-08T16:42:38.876Z',
    );
    expect(status).toHaveAttribute('href', '/app/cti-feed');
    // Only the tooltip describes it.
    expect(status).not.toHaveAttribute('title');
  });

  it('leads with the state that most needs attention', () => {
    withConsumers([
      consumer('iocs', { status: 'running', local_offset: 5 }),
      consumer('vulnerabilities'),
    ]);
    render(<CtiFeedSyncStatus />);
    expect(screen.getByTestId('ctiFeedSyncStatus')).toHaveTextContent(
      'Syncing feeds',
    );
  });

  it.each([
    ['while loading', { loading: true }],
    ['when the state cannot be read', { error: 'Forbidden' }],
  ])('renders nothing %s', (_label, state) => {
    withConsumers([consumer('iocs')], state);
    const { container } = render(<CtiFeedSyncStatus />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('getLastUpdatedAt', () => {
  it('returns the latest valid time', () => {
    expect(
      getLastUpdatedAt([
        consumer('iocs', { updated_at: '2026-11-08T10:00:00.000Z' }),
        consumer('vulnerabilities', { updated_at: 'not a date' }),
        consumer('ruleset', { updated_at: '2026-11-08T12:00:00.000Z' }),
      ]),
    ).toBe('2026-11-08T12:00:00.000Z');
  });

  it('returns nothing without a time', () => {
    expect(getLastUpdatedAt([consumer('iocs')])).toBeUndefined();
  });
});
