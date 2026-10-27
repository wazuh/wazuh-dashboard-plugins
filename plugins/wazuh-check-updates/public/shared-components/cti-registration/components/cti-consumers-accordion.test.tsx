jest.mock('../../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getCore } from '../../../plugin-services';
import { routes } from '../../../../common/constants';
import { CtiConsumersAccordion } from './cti-consumers-accordion';

const mockedHttpGet = jest.fn();

describe('CtiConsumersAccordion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      http: { get: mockedHttpGet },
    });
  });

  it('shows a collapsed summary and reveals the detail fields when expanded', async () => {
    /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'ready',
          local_offset: 10,
          remote_offset: 10,
        },
      ],
    });
    /* eslint-enable camelcase */

    render(<CtiConsumersAccordion />);

    await waitFor(() =>
      expect(mockedHttpGet).toHaveBeenCalledWith(routes.ctiConsumers),
    );

    expect(await screen.findByText('consumer-1')).toBeInTheDocument();
    expect(screen.getByText('Show details')).toBeInTheDocument();

    expect(screen.queryByText('ctx-1')).not.toBeInTheDocument();
    expect(screen.queryByText('type-1')).not.toBeInTheDocument();
    expect(
      screen.queryByText('https://example.test/resource-1'),
    ).not.toBeInTheDocument();

    const detailsToggle = document.querySelector(
      '[data-test-subj="ctiConsumerDetailsToggle"]',
    ) as HTMLElement;
    fireEvent.click(detailsToggle);

    expect(screen.getByText('ctx-1')).toBeInTheDocument();
    expect(screen.getByText('type-1')).toBeInTheDocument();
    expect(
      screen.getByText('https://example.test/resource-1'),
    ).toBeInTheDocument();
    expect(screen.getByText('Hide details')).toBeInTheDocument();

    const resourceItem = document.querySelector(
      '[data-test-subj="ctiConsumersResourceItem"]',
    );
    expect(resourceItem).not.toBeNull();
    expect(resourceItem).toHaveTextContent('https://example.test/resource-1');

    fireEvent.click(detailsToggle);

    expect(screen.queryByText('ctx-1')).not.toBeInTheDocument();
    expect(screen.getByText('Show details')).toBeInTheDocument();
  });

  it.each([
    ['2026-05-21T12:26:16.581939Z', 'formatted 2026-05-21T12:26:16.581939Z'],
    [undefined, '-'],
  ])(
    'shows the last update time %p in the details',
    async (updatedAt, expected) => {
      /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
      mockedHttpGet.mockResolvedValue({
        data: [
          {
            name: 'consumer-1',
            context: 'ctx-1',
            type: 'type-1',
            resource: '',
            is_public: true,
            status: 'ready',
            local_offset: 10,
            remote_offset: 10,
            updated_at: updatedAt,
          },
        ],
      });
      /* eslint-enable camelcase */

      render(<CtiConsumersAccordion />);
      await screen.findByText('consumer-1');
      fireEvent.click(
        document.querySelector(
          '[data-test-subj="ctiConsumerDetailsToggle"]',
        ) as HTMLElement,
      );

      expect(
        document.querySelector('[data-test-subj="ctiConsumersUpdatedAtItem"]'),
      ).toHaveTextContent(`Last updated${expected}`);
    },
  );

  it.each([
    [['rules', 'detectors'], 'rules, detectors'],
    [[], 'None'],
    [undefined, '-'],
  ])(
    'shows the pending sync phases %p in the details',
    async (phases, expected) => {
      /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
      mockedHttpGet.mockResolvedValue({
        data: [
          {
            name: 'consumer-1',
            context: 'ctx-1',
            type: 'type-1',
            resource: '',
            is_public: true,
            status: 'ready',
            local_offset: 10,
            remote_offset: 10,
            pending_sync_phases: phases,
          },
        ],
      });
      /* eslint-enable camelcase */

      render(<CtiConsumersAccordion />);
      await screen.findByText('consumer-1');
      fireEvent.click(
        document.querySelector(
          '[data-test-subj="ctiConsumerDetailsToggle"]',
        ) as HTMLElement,
      );

      expect(
        document.querySelector(
          '[data-test-subj="ctiConsumersPendingSyncPhasesItem"]',
        ),
      ).toHaveTextContent(`Pending phases${expected}`);
    },
  );

  it('shows an "Up to date" badge when the consumer is ready and offsets match', async () => {
    /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'ready',
          local_offset: 10,
          remote_offset: 10,
        },
      ],
    });
    /* eslint-enable camelcase */

    render(<CtiConsumersAccordion />);

    expect(await screen.findByText('Up to date')).toBeInTheDocument();
  });

  it('shows a "Syncing" badge when the status is running', async () => {
    /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'running',
          local_offset: 8,
          remote_offset: 10,
        },
      ],
    });
    /* eslint-enable camelcase */

    render(<CtiConsumersAccordion />);

    expect(await screen.findByText('Syncing')).toBeInTheDocument();
  });

  it('shows a "Failed" badge when the status is failed', async () => {
    /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'failed',
          local_offset: 8,
          remote_offset: 10,
        },
      ],
    });
    /* eslint-enable camelcase */

    render(<CtiConsumersAccordion />);

    expect(await screen.findByText('Failed')).toBeInTheDocument();
  });

  it('falls back to showing the raw status for an unrecognized value', async () => {
    /* eslint-disable camelcase -- CtiConsumer fixture matches the CTI API's snake_case fields */
    mockedHttpGet.mockResolvedValue({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'some-unrecognized-value',
          local_offset: 8,
          remote_offset: 10,
        },
      ],
    });
    /* eslint-enable camelcase */

    render(<CtiConsumersAccordion />);

    expect(
      await screen.findByText('some-unrecognized-value'),
    ).toBeInTheDocument();
  });

  it('shows an empty state when no consumers are returned', async () => {
    mockedHttpGet.mockResolvedValue({ data: [] });

    render(<CtiConsumersAccordion />);

    expect(await screen.findByText('No consumers')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    mockedHttpGet.mockRejectedValue(new Error('network error'));

    render(<CtiConsumersAccordion />);

    expect(
      await screen.findByText('Could not load consumers'),
    ).toBeInTheDocument();
  });
});
