import ErrorHandler from '../error-handler';

/**
 *
 * @param callback
 * @returns
 */
export const useErrorHandler = async (callback: Function) => {
  try {
    let res = await callback();
    return [res, null];
  } catch (error) {
    // should execute errorHandler
    ErrorHandler.handleError(error);
    return [null, error];
  }
};
