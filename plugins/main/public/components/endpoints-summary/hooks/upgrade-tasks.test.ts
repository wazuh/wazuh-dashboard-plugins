import { renderHook } from '@testing-library/react-hooks';
import { getTasks } from '../services';
import { useGetUpgradeTasks } from './upgrade-tasks';
import { API_NAME_TASK_STATUS } from '../../../../common/constants';

jest.mock('../services', () => ({
  getTasks: jest.fn(),
  isPermissionError: jest.requireActual('../services/is-permission-error')
    .isPermissionError,
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

    const { result, waitForNextUpdate } = renderHook(() =>
      useGetUpgradeTasks(false),
    );

    expect(result.current.getInProgressIsLoading).toBe(true);
    expect(result.current.totalInProgressTasks).toBe(0);
    expect(result.current.getInProgressError).toBeUndefined();

    expect(result.current.getSuccessIsLoading).toBe(true);
    expect(result.current.totalSuccessTasks).toBe(0);
    expect(result.current.getSuccessError).toBeUndefined();

    expect(result.current.getErrorIsLoading).toBe(true);
    expect(result.current.totalErrorUpgradeTasks).toBe(0);
    expect(result.current.getErrorTasksError).toBeUndefined();

    await waitForNextUpdate();
    jest.advanceTimersByTime(500);

    expect(result.current.getInProgressIsLoading).toBe(false);
    expect(result.current.totalInProgressTasks).toBe(5);
    expect(result.current.getInProgressError).toBeUndefined();

    jest.advanceTimersByTime(500);

    expect(result.current.getSuccessIsLoading).toBe(false);
    expect(result.current.totalSuccessTasks).toBe(3);
    expect(result.current.getSuccessError).toBeUndefined();

    jest.advanceTimersByTime(500);

    expect(result.current.getErrorIsLoading).toBe(false);
    expect(result.current.totalErrorUpgradeTasks).toBe(2);
    expect(result.current.getErrorTasksError).toBeUndefined();
  });

  it('should clear interval when totalInProgressTasks is 0', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    mockGetTasks.mockResolvedValue({ total_affected_items: 0 });

    const { waitForNextUpdate } = renderHook(() => useGetUpgradeTasks(false));

    await waitForNextUpdate();
    jest.advanceTimersByTime(500);

    expect(clearInterval).toHaveBeenCalledTimes(1);
  });

  it('should handle error while fetching data', async () => {
    const mockErrorMessage = 'Some error occurred';
    (getTasks as jest.Mock).mockRejectedValue(mockErrorMessage);

    const { result, waitForNextUpdate } = renderHook(() =>
      useGetUpgradeTasks(0),
    );

    expect(result.current.getInProgressIsLoading).toBeTruthy();
    await waitForNextUpdate();
    expect(result.current.getInProgressError).toBe(mockErrorMessage);
    expect(result.current.getInProgressIsLoading).toBeFalsy();
  });

  it('should stop polling when a permission error is detected on the In progress query', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    const permissionError = new Error(
      'API error: ERR_BAD_REQUEST - Permission denied: Resource type: *:*',
    );

    mockGetTasks.mockImplementation(async ({ status }) => {
      if (status === API_NAME_TASK_STATUS.IN_PROGRESS) {
        throw permissionError;
      }
      return { total_affected_items: 0 };
    });

    const { waitForNextUpdate } = renderHook(() => useGetUpgradeTasks(false));

    await waitForNextUpdate();
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(3000);

    const inProgressCalls = mockGetTasks.mock.calls.filter(
      ([params]: any[]) => params.status === API_NAME_TASK_STATUS.IN_PROGRESS,
    );

    expect(inProgressCalls).toHaveLength(1);
  });

  it('should not refetch the whole task set when the permission error is detected', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    mockGetTasks.mockRejectedValue(
      new Error(
        'API error: ERR_BAD_REQUEST - Permission denied: Resource type: *:*',
      ),
    );

    const { waitForNextUpdate } = renderHook(() => useGetUpgradeTasks(false));

    await waitForNextUpdate();
    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    expect(mockGetTasks).toHaveBeenCalledTimes(4);
  });

  it('should stop polling when a permission error is detected on a query other than In progress', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;
    const permissionError = new Error(
      'API error: ERR_BAD_REQUEST - Permission denied: Resource type: *:*',
    );

    mockGetTasks.mockImplementation(async ({ status }) => {
      if (status === API_NAME_TASK_STATUS.DONE) {
        throw permissionError;
      }
      return { total_affected_items: 1 };
    });

    const { waitForNextUpdate } = renderHook(() => useGetUpgradeTasks(false));

    await waitForNextUpdate();
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(3000);

    const inProgressCalls = mockGetTasks.mock.calls.filter(
      ([params]: any[]) => params.status === API_NAME_TASK_STATUS.IN_PROGRESS,
    );

    expect(inProgressCalls).toHaveLength(1);
  });

  it('should continue polling every 3s when in-progress tasks exist and there is no permission error', async () => {
    const mockGetTasks = jest.requireMock('../services').getTasks;

    mockGetTasks.mockImplementation(async ({ status }) => {
      if (status === API_NAME_TASK_STATUS.IN_PROGRESS) {
        return { total_affected_items: 1 };
      }
      return { total_affected_items: 0 };
    });

    const { waitForNextUpdate } = renderHook(() => useGetUpgradeTasks(false));

    await waitForNextUpdate();

    const inProgressCallsBefore = mockGetTasks.mock.calls.filter(
      ([params]: any[]) => params.status === API_NAME_TASK_STATUS.IN_PROGRESS,
    );
    expect(inProgressCallsBefore).toHaveLength(1);

    jest.advanceTimersByTime(3000);
    await Promise.resolve();

    const inProgressCallsAfter = mockGetTasks.mock.calls.filter(
      ([params]: any[]) => params.status === API_NAME_TASK_STATUS.IN_PROGRESS,
    );
    expect(inProgressCallsAfter.length).toBeGreaterThan(
      inProgressCallsBefore.length,
    );
  });
});
