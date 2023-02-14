import { useErrorHandler } from './useErrorHandler';
import { ErrorHandler } from '../error-handler';

jest.mock('../error-handler');

describe('UseErrorHandler', () => {
  it('should return error instance and pass to ErrorHandler when callback fails', async () => {
    const callbackWithError = async () => {
      return Promise.reject(new Error('callback error'));
    };
    const spyErrorHandler = jest.spyOn(ErrorHandler, 'handleError');
    const [res, error] = await useErrorHandler(callbackWithError);
    expect(res).toBe(null);
    expect(error).toBeDefined();
    expect(spyErrorHandler).toBeCalledWith(new Error('callback error'));
  });

  it('should return error instance when callback is resolved', async () => {
    const callbackWithoutError = async () => {
      return Promise.resolve({
        success: true,
      });
    };

    const [res, error] = await useErrorHandler(callbackWithoutError);
    expect(res).toBeDefined();
    expect(error).toBeNull();
  });
});
