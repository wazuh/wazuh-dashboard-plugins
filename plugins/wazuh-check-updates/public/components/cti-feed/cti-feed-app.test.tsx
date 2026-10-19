/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../../plugin-services', () => ({
  getCore: jest.fn(),
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
import { getCore } from '../../plugin-services';
import {
  fetchCtiConsumers,
  fetchFeedContentCounts,
  requestCtiContentUpdate,
} from '../../services/cti-feed';
import { useCtiRegistrationModal } from '../../shared-components/cti-registration/hooks/use-cti-registration-modal';
import { statusCodes } from '../../../common/constants';
import { CtiFeedApp } from './cti-feed-app';
import { CTI_FEED_SYNC_POLL_MS } from './hooks/use-cti-consumers';

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

  test('requests a content update and watches the sync', async () => {
    render(<CtiFeedApp />);
    await settle();
    const fetchesBefore = mockFetchConsumers.mock.calls.length;

    fireEvent.click(screen.getByTestId('ctiFeedUpdateButton'));

    await waitFor(() =>
      expect(mockAddSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'CTI update requested' }),
      ),
    );
    expect(mockRequestUpdate).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(mockFetchConsumers.mock.calls.length).toBeGreaterThan(
        fetchesBefore,
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId('ctiFeedUpdateButton')).not.toBeDisabled(),
    );
  });

  test('reports a failed content update', async () => {
    const error = new Error('Forbidden');
    mockRequestUpdate.mockRejectedValue(error);
    render(<CtiFeedApp />);
    await settle();

    fireEvent.click(screen.getByTestId('ctiFeedUpdateButton'));

    await waitFor(() =>
      expect(mockAddError).toHaveBeenCalledWith(error, {
        title: 'Error updating CTI feeds',
      }),
    );
    expect(mockAddSuccess).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByTestId('ctiFeedUpdateButton')).not.toBeDisabled(),
    );
  });

  test('refreshes the content counts once a sync finishes', async () => {
    jest.useFakeTimers();
    try {
      mockFetchConsumers
        .mockResolvedValueOnce({ data: [consumer('running')] })
        .mockResolvedValue({ data: [consumer('ready')] });

      render(<CtiFeedApp />);
      await screen.findByText('Syncing new content');
      expect(mockFetchCounts).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(CTI_FEED_SYNC_POLL_MS);
        await Promise.resolve();
      });

      await screen.findByText('All feeds are up to date');
      await waitFor(() => expect(mockFetchCounts).toHaveBeenCalledTimes(2));
    } finally {
      jest.useRealTimers();
    }
  });
});
