import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import React, { useEffect } from 'react';
import {
  errorHandlerDecorator,
  errorHandlerWrapper,
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

  it.skip('should catch the error from react functional component', () => {
    const errorGenerated = new Error('callback error');
    const functionWithError = () => {
      throw errorGenerated;
    };

    const Component = (props: any) => {
      useEffect(() => {
        // Component did mount
        functionWithError();
      }, []);
      return <div>Example Component</div>;
    };

    const ComponentWithDecorator = errorHandlerDecorator(Component);
    render(<ComponentWithDecorator />);
    expect(ErrorHandler.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(errorGenerated);
  });

  it.skip('should catch all error from class', () => {
    const errorGenerated = new Error('callback error');
    class classMocked {
      methodWithError() {
        throw errorGenerated;
      }
    }

    const classMockedWithError = errorHandlerDecorator(classMocked);
  });
});
