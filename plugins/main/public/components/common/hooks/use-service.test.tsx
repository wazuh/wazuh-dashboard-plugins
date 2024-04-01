import { renderHook } from '@testing-library/react-hooks';
import { useService } from './use-service';

const successfulService = async (_params?: any) => {
  return Promise.resolve('test data');
};
const failingService = async (_params?: any) => {
  return Promise.reject('Error occurred');
};
const successfulRefreshService = async (_params?: any) => {
  return Promise.resolve(Date.now());
};

const successfulServiceWithParams = jest.fn().mockResolvedValue('test data');

describe('useService hook', () => {
  it('should return data and success state when service call is successful', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useService(successfulService),
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual('test data');
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.isSuccess).toEqual(true);
    expect(result.current.isError).toEqual(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return error state when service call fails', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useService(failingService),
    );

    await waitForNextUpdate();

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.isSuccess).toEqual(false);
    expect(result.current.isError).toEqual(true);
    expect(result.current.error).toEqual('Error occurred');
  });

  it('should fetch data again with new data when refresh value changes', async () => {
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ refresh }) => useService(successfulRefreshService, undefined, refresh),
      { initialProps: { refresh: 0 } },
    );

    await waitForNextUpdate();

    const data = result.current.data;

    rerender({ refresh: 1 });
    await waitForNextUpdate();

    expect(result.current.data).not.toEqual(data);
  });

  it('should call the service with provided parameters', async () => {
    const params = { id: 123456 };

    renderHook(() => useService(successfulServiceWithParams, params));

    expect(successfulServiceWithParams).toHaveBeenCalledWith(params);
  });
});
