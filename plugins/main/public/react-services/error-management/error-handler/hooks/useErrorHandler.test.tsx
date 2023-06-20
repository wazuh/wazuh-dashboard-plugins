import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorHandler } from '../error-handler';
import { useErrorHandler } from './useErrorHandler';
import React from 'react';

jest.mock('../error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn(),
  },
}));
describe('UseErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('should return error instance and pass to ErrorHandler when callback fails', async () => {
    const callbackWithError = async () => {
      return Promise.reject(new Error('callback error'));
    };

    let Component = () => {
      const [res, error] = useErrorHandler(callbackWithError);
      return <div>Mocked component</div>;
    };
    const { container, findByText } = render(<Component />);

    await waitFor(async () => {
      await findByText('Mocked component');
    });

    expect(container).toBeInTheDocument();
    expect(ErrorHandler.handleError).toHaveBeenCalledTimes(1);
    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      new Error('callback error'),
    );
  });

  it('should return error instance when callback is resolved', async () => {
    const callbackWithoutError = async () => {
      return Promise.resolve({
        success: true,
      });
    };

    let Component = () => {
      const [res, error] = useErrorHandler(callbackWithoutError);
      return <div>Mocked component</div>;
    };

    const { container, findByText } = render(<Component />);

    await waitFor(async () => {
      await findByText('Mocked component');
    });

    expect(container).toBeInTheDocument();
    expect(ErrorHandler.handleError).toHaveBeenCalledTimes(0);
  });
});
