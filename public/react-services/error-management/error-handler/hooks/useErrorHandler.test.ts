import { ErrorHandler } from '../../error-handler';
import { useErrorHandler } from './useErrorHandler';

jest.mock('../error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn()
  }
}));
describe('UseErrorHandler', () => {
  it('should return error instance and pass to ErrorHandler when callback fails', async () => {
    ErrorHandler.handleError = jest.fn().mockImplementation(() => new Error('callback error'));
    const callbackWithError = async () => {
      return Promise.reject(new Error('callback error'));
    };
    const [res, error] = await useErrorHandler(callbackWithError);
    expect(res).toBe(null);
    expect(error).toBeDefined();
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
