/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
  getWazuhCore: () => ({
    utils: { formatUIDate: (date: string) => `formatted ${date}` },
  }),
}));

jest.mock('../../services/cti-feed', () => ({
  fetchCtiConsumers: jest.fn(),
  fetchFeedContentCounts: jest.fn(),
  requestCtiContentUpdate: jest.fn(),
}));

jest.mock(
  '../../shared-components/cti-registration/hooks/use-cti-registration-modal',
  () => ({ useCtiRegistrationModal: jest.fn() }),
);

jest.mock(
  '../../shared-components/cti-registration/components/modal-cti',
  () => ({
    ModalCti: () => <div data-test-subj='ctiRegistrationModal' />,
  }),
);

import React from 'react';
import {
  act,
  configure,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { of } from 'rxjs';
import { getCore } from '../../plugin-services';
import {
  fetchCtiConsumers,
  fetchFeedContentCounts,
  requestCtiContentUpdate,
} from '../../services/cti-feed';
import { useCtiRegistrationModal } from '../../shared-components/cti-registration/hooks/use-cti-registration-modal';
import { statusCodes } from '../../../common/constants';
import { CtiFeedApp } from './cti-feed-app';

configure({ testIdAttribute: 'data-test-subj' });

const mockAddSuccess = jest.fn();
const mockAddError = jest.fn();
const mockFetchConsumers = fetchCtiConsumers as jest.Mock;
const mockFetchCounts = fetchFeedContentCounts as jest.Mock;
const mockRequestUpdate = requestCtiContentUpdate as jest.Mock;
const mockUseRegistration = useCtiRegistrationModal as jest.Mock;

const COUNTS = {
  rules: 365,
  decoders: 514,
  integrations: 127,
  kvdbs: 49,
  iocs: 672843,
  vulnerabilities: 402878,
};

const consumer = (status: string) => ({
  name: 'public-ruleset-5',
  context: 'ctx',
  type: 'cti:catalog:consumer:ruleset',
  resource: '',
  is_public: true,
  status,
  local_offset: 10,
  remote_offset: 10,
});

/** Waits for the sync state and the content counts to finish loading. */
const settle = async () => {
  await screen.findByText('All feeds are up to date');
  await waitFor(() =>
    expect(screen.getByTestId('ctiFeedContentStat-rules')).toHaveTextContent(
      '365',
    ),
  );
};

describe('CtiFeedApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      application: {
        currentAppId$: of('cti-feed'),
        getUrlForApp: (appId: string, { path = '' } = {}) =>
          `/app/${appId}${path}`,
        navigateToUrl: jest.fn(),
      },
      notifications: {
        toasts: { addSuccess: mockAddSuccess, addError: mockAddError },
      },
    });
    mockUseRegistration.mockImplementation((initiallyOpen: boolean) => ({
      statusCTI: { status: statusCodes.NOT_FOUND, message: '' },
      loading: false,
      deviceFlowActive: false,
      refetchStatus: jest.fn(),
      isModalOpen: initiallyOpen,
      openModal: jest.fn(),
      toggleModal: jest.fn(),
      onDeviceFlowStarted: jest.fn(),
    }));
    mockFetchConsumers.mockResolvedValue({ data: [consumer('ready')] });
    mockFetchCounts.mockResolvedValue(COUNTS);
    mockRequestUpdate.mockResolvedValue(undefined);
  });

  test('shows the subscription, the feed sync and the feed content', async () => {
    render(<CtiFeedApp />);

    expect(screen.getByTestId('ctiFeedSubscriptionPanel')).toBeInTheDocument();
    expect(
      await screen.findByText('All feeds are up to date'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('ctiFeedContentStat-rules'),
    ).toHaveTextContent('365');
    expect(screen.queryByTestId('ctiRegistrationModal')).toBeNull();
  });

  test('opens the registration modal when asked on arrival', async () => {
    render(<CtiFeedApp openRegistration />);

    expect(mockUseRegistration).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('ctiRegistrationModal')).toBeInTheDocument();
    await settle();
  });

  test('shows when the indexer last checked for updates', async () => {
    mockFetchConsumers.mockResolvedValue({
      data: [consumer('ready')],
      last_checked_at: new Date(Date.now() - 5 * 60000).toISOString(),
    });
    render(<CtiFeedApp />);
    await settle();

    expect(screen.getByTestId('ctiFeedLastCheckedAt')).toHaveTextContent(
      'Last checked: 5 minutes ago',
    );
  });

  test('shows a dash when the indexer does not report the last check', async () => {
    render(<CtiFeedApp />);
    await settle();

    expect(screen.getByTestId('ctiFeedLastCheckedAt')).toHaveTextContent(
      'Last checked: -',
    );
  });

  test('checks for updates and reads the last check time back', async () => {
    render(<CtiFeedApp />);
    await settle();
    const checkedAt = new Date(Date.now() - 1000).toISOString();
    mockFetchConsumers.mockResolvedValue({
      data: [consumer('ready')],
      last_checked_at: checkedAt,
    });

    fireEvent.click(screen.getByTestId('ctiFeedCheckForUpdatesButton'));

    await waitFor(() =>
      expect(mockAddSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Checking for updates' }),
      ),
    );
    expect(mockRequestUpdate).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId('ctiFeedLastCheckedAt')).toHaveTextContent(
        'Last checked: a few seconds ago',
      ),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('ctiFeedCheckForUpdatesButton'),
      ).not.toBeDisabled(),
    );
  });

  test('reports a failed update check', async () => {
    const error = new Error('Forbidden');
    mockRequestUpdate.mockRejectedValue(error);
    render(<CtiFeedApp />);
    await settle();

    fireEvent.click(screen.getByTestId('ctiFeedCheckForUpdatesButton'));

    await waitFor(() =>
      expect(mockAddError).toHaveBeenCalledWith(error, {
        title: 'Could not check for updates',
      }),
    );
    expect(mockAddSuccess).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.getByTestId('ctiFeedCheckForUpdatesButton'),
      ).not.toBeDisabled(),
    );
  });

  test('does not poll; a refresh finding the sync done refreshes the counts', async () => {
    jest.useFakeTimers();
    try {
      mockFetchConsumers
        .mockResolvedValueOnce({ data: [consumer('running')] })
        .mockResolvedValue({ data: [consumer('ready')] });

      render(<CtiFeedApp />);
      await screen.findByText('Syncing new content');
      expect(mockFetchCounts).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(5 * 60000);
        await Promise.resolve();
      });
      expect(mockFetchConsumers).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByTestId('ctiFeedSyncRefresh'));

      await screen.findByText('All feeds are up to date');
      await waitFor(() => expect(mockFetchCounts).toHaveBeenCalledTimes(2));
    } finally {
      jest.useRealTimers();
    }
  });
});
