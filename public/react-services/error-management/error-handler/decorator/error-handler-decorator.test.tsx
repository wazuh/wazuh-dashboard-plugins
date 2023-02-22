import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useEffect } from 'react';
import {
  errorHandlerDecorator
} from './error-handler-decorator';
import { ErrorHandler } from '../error-handler';

jest.mock('../error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));

describe('Error handler decorator', () => {
  it('should return a function', () => {
    const result = errorHandlerDecorator(() => {});
    expect(typeof result).toBe('function');
  });

  it('should catch the error if the function throws an error', () => {
    const errorGenerated = new Error('callback error');
    const result = errorHandlerDecorator(() => {
      throw errorGenerated;
    });
    result();
    expect(ErrorHandler.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(errorGenerated);
  });
});
