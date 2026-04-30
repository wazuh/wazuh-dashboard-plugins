import { renderHook, waitFor } from '@testing-library/react';
import { useService } from './use-service';

const successfulService = async (_params?: any) => {
  return Promise.resolve('test data');
};
const failingService = async (_params?: any) => {
  return Promise.reject('Error occurred');
};

let callCount = 0;
const successfulRefreshService = async (_params?: any) => {
  return Promise.resolve(++callCount);
};

const successfulServiceWithParams = jest.fn().mockResolvedValue('test data');

describe('useService hook', () => {
  beforeEach(() => {
    callCount = 0;
  });

  it('should return data and success state when service call is successful', async () => {
    const { result } = renderHook(() => useService(successfulService));

    await waitFor(() => expect(result.current.isLoading).toEqual(false));

    expect(result.current.data).toEqual('test data');
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.isSuccess).toEqual(true);
    expect(result.current.isError).toEqual(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should return error state when service call fails', async () => {
    const { result } = renderHook(() => useService(failingService));

    await waitFor(() => expect(result.current.isLoading).toEqual(false));

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toEqual(false);
    expect(result.current.isSuccess).toEqual(false);
    expect(result.current.isError).toEqual(true);
    expect(result.current.error).toEqual('Error occurred');
  });

  it('should fetch data again with new data when refresh value changes', async () => {
    const { result, rerender } = renderHook(
      ({ refresh }) => useService(successfulRefreshService, undefined, refresh),
      { initialProps: { refresh: 0 } },
    );

    await waitFor(() => expect(result.current.isLoading).toEqual(false));

    const data = result.current.data;

    rerender({ refresh: 1 });
    await waitFor(() => expect(result.current.data).not.toEqual(data));

    expect(result.current.data).not.toEqual(data);
  });

  it('should call the service with provided parameters', async () => {
    const params = { id: 123456 };

    const { result } = renderHook(() =>
      useService(successfulServiceWithParams, params),
    );

    expect(successfulServiceWithParams).toHaveBeenCalledWith(params);

    await waitFor(() => expect(result.current.isLoading).toEqual(false));
  });
});
