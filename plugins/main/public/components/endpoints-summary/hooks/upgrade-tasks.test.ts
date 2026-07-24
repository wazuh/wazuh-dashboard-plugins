import { act, renderHook, waitFor } from '@testing-library/react';
import { getTasks } from '../services';
import { useGetUpgradeTasks } from './upgrade-tasks';
import { API_NAME_TASK_STATUS } from '../../../../common/constants';

jest.mock('../services', () => ({
  getTasks: jest.fn(),
}));

jest.useFakeTimers();
jest.spyOn(global, 'clearInterval');

describe('useGetUpgradeTasks hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch initial data without any error', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    mockGetTasks.mockImplementation(async ({ status }) => {
      if (status === API_NAME_TASK_STATUS.IN_PROGRESS) {
        return { total_affected_items: 5 };
      }
      if (status === API_NAME_TASK_STATUS.DONE) {
        return { total_affected_items: 3 };
      }
      return { total_affected_items: 2 };
    });

    const { result } = renderHook(() => useGetUpgradeTasks(false));

    expect(result.current.getInProgressIsLoading).toBe(true);
    expect(result.current.totalInProgressTasks).toBe(0);
    expect(result.current.getInProgressError).toBeUndefined();

    expect(result.current.getSuccessIsLoading).toBe(true);
    expect(result.current.totalSuccessTasks).toBe(0);
    expect(result.current.getSuccessError).toBeUndefined();

    expect(result.current.getErrorIsLoading).toBe(true);
    expect(result.current.totalErrorUpgradeTasks).toBe(0);
    expect(result.current.getErrorTasksError).toBeUndefined();

    await waitFor(() => expect(result.current.getTimeoutIsLoading).toBe(false));

    expect(result.current.getInProgressIsLoading).toBe(false);
    expect(result.current.totalInProgressTasks).toBe(5);
    expect(result.current.getInProgressError).toBeUndefined();

    expect(result.current.getSuccessIsLoading).toBe(false);
    expect(result.current.totalSuccessTasks).toBe(3);
    expect(result.current.getSuccessError).toBeUndefined();

    expect(result.current.getErrorIsLoading).toBe(false);
    expect(result.current.totalErrorUpgradeTasks).toBe(2);
    expect(result.current.getErrorTasksError).toBeUndefined();
  });

  it('should clear interval when totalInProgressTasks is 0', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    mockGetTasks.mockResolvedValue({ total_affected_items: 0 });

    renderHook(() => useGetUpgradeTasks(false));

    await waitFor(() => expect(clearInterval).toHaveBeenCalled());

    expect(clearInterval).toHaveBeenCalledTimes(1);
  });

  it('should never call getTasks nor create an interval when enabled is false', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    mockGetTasks.mockResolvedValue({ total_affected_items: 0 });

    renderHook(() => useGetUpgradeTasks(false, false));

    await Promise.resolve();
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(3000);

    expect(mockGetTasks).not.toHaveBeenCalled();
  });

  it('should fetch data when enabled is true', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    mockGetTasks.mockResolvedValue({ total_affected_items: 0 });

    const { waitForNextUpdate } = renderHook(() =>
      useGetUpgradeTasks(false, true),
    );

    await waitForNextUpdate();

    expect(mockGetTasks).toHaveBeenCalled();
  });

  it('should handle error while fetching data', async () => {
    const mockErrorMessage = 'Some error occurred';
    (getTasks as jest.Mock).mockRejectedValue(mockErrorMessage);

    const { result } = renderHook(() => useGetUpgradeTasks(0));

    expect(result.current.getInProgressIsLoading).toBeTruthy();
    await waitFor(() =>
      expect(result.current.getInProgressIsLoading).toBeFalsy(),
    );
    expect(result.current.getInProgressError).toBe(mockErrorMessage);
    expect(result.current.getInProgressIsLoading).toBeFalsy();
  });
});
