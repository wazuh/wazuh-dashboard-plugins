import { ErrorHandler } from '../error-handler';

export const errorHandlerDecorator = (fn: any) => {
  return function (...args: any) {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        ErrorHandler.handleError(error);
      }
    }
  };
};
