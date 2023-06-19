import React, { useEffect, useLayoutEffect, useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { withErrorHandler, ErrorHandlerComponent } from './withErrorHandler';
import { ErrorHandler } from '../error-handler';

const functionWithError = () => {
  throw new Error('Error generated');
};

jest.mock('../error-handler', () => ({
  ErrorHandler: {
    handleError: jest.fn()
  }
}));

describe('withErrorHandler', () => {
  describe('Functional Component', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should catch error when exist error on ComponentDidMount event and call ErrorHandler', () => {
      const Component = (props: any) => {
        useEffect(() => {
          // Component did mount
          functionWithError();
        }, []);
        return <div>Example Component</div>;
      };
      // to avoid react console error when error boundary throw error
      const spyReactConsoleError = jest.spyOn(console, 'error');
      spyReactConsoleError.mockImplementation(() => {});
      // spy on componentDidCatch to check if it was called
      const spyComponentDidCatch = jest.spyOn(ErrorHandlerComponent.prototype, 'componentDidCatch');

      const ComponentWithErrorHandler = withErrorHandler(Component);
      expect(() => render(<ComponentWithErrorHandler />)).not.toThrowError();
      expect(spyComponentDidCatch).toHaveBeenCalledTimes(1);
      expect(spyComponentDidCatch).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
      // spy on ErrorHandler to check if it was called
      expect(ErrorHandler.handleError).toHaveBeenCalledTimes(1);
      spyReactConsoleError.mockRestore();
      spyComponentDidCatch.mockRestore();
    });

    it('should catch error when exist error on ComponentDidUpdate event and call ErrorHandler', () => {
      const Component = (props: any) => {
        const [count, setCount] = useState(0);
        useEffect(() => {
          // Component did update
          if (count > 0) functionWithError();
        }, [count]);

        return (
          <div>
            <button onClick={() => setCount(1)}>Button</button>
            Example Component
          </div>
        );
      };
      // to avoid react console error when error boundary throw error
      const spyReactConsoleError = jest.spyOn(console, 'error');
      spyReactConsoleError.mockImplementation(() => {});
      const spyComponentDidCatch = jest.spyOn(ErrorHandlerComponent.prototype, 'componentDidCatch');
      const ComponentWithErrorHandler = withErrorHandler(Component);
      const { getByRole } = render(<ComponentWithErrorHandler />);
      const btnWithError = getByRole('button');
      fireEvent.click(btnWithError);
      expect(spyComponentDidCatch).toHaveBeenCalledTimes(1);
      expect(spyComponentDidCatch).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
      expect(ErrorHandler.handleError).toHaveBeenCalledTimes(1);
      spyReactConsoleError.mockRestore();
      spyComponentDidCatch.mockRestore();
    });

  });
});
