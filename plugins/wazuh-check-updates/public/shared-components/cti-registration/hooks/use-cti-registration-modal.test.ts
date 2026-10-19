import { act, renderHook, waitFor } from '@testing-library/react';
import { useCtiRegistrationModal } from './use-cti-registration-modal';
import { useCtiStatus } from './useCtiStatus';
import { ctiFlowState } from '../../../services/cti-flow-state';
import { cancelCtiRegistration } from '../../../services/cti-registration-status';
import { statusCodes } from '../../../../common/constants';

jest.mock('./useCtiStatus', () => ({
  useCtiStatus: jest.fn(),
}));

jest.mock('../../../services/cti-registration-status', () => ({
  cancelCtiRegistration: jest.fn(),
}));

jest.mock('../../../plugin-services', () => ({
  getCtiRegistrationStatusPollIntervalSec: () => 30,
}));

const mockUseCtiStatus = useCtiStatus as jest.Mock;
const mockCancel = cancelCtiRegistration as jest.Mock;
const mockRefetch = jest.fn();

const mockStatus = (deviceFlowActive: boolean) =>
  mockUseCtiStatus.mockReturnValue({
    statusCTI: { status: statusCodes.NOT_FOUND, message: '' },
    loading: false,
    deviceFlowActive,
    refetchStatus: mockRefetch,
  });

describe('useCtiRegistrationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ctiFlowState.reset();
    mockCancel.mockResolvedValue(undefined);
    mockRefetch.mockResolvedValue(undefined);
  });

  test('starts closed unless asked to open', () => {
    mockStatus(false);

    expect(
      renderHook(() => useCtiRegistrationModal()).result.current.isModalOpen,
    ).toBe(false);
    expect(
      renderHook(() => useCtiRegistrationModal(true)).result.current
        .isModalOpen,
    ).toBe(true);
  });

  test('opens and closes without cancelling when no activation is pending', () => {
    mockStatus(false);
    const { result } = renderHook(() => useCtiRegistrationModal());

    act(() => result.current.openModal());
    expect(result.current.isModalOpen).toBe(true);

    act(() => result.current.toggleModal());
    expect(result.current.isModalOpen).toBe(false);
    expect(mockCancel).not.toHaveBeenCalled();
  });

  test('cancels a pending activation when the modal closes', async () => {
    mockStatus(true);
    const { result } = renderHook(() => useCtiRegistrationModal(true));

    act(() => result.current.toggleModal());

    expect(result.current.isModalOpen).toBe(false);
    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });

  test('restarts status polling when the device flow starts', () => {
    mockStatus(false);
    const { result } = renderHook(() => useCtiRegistrationModal());

    act(() => result.current.onDeviceFlowStarted());

    expect(mockUseCtiStatus).toHaveBeenLastCalledWith(1, 30);
  });
});
