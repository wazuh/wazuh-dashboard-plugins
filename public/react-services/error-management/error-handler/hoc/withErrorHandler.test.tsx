import React, { useEffect, useLayoutEffect, useState } from 'react';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { withErrorHandler, ErrorHandlerComponent } from './withErrorHandler';
import { debug } from 'console';

const functionWithError = () => {
  throw new Error('Error generated');
};

describe('withErrorHandler', () => {
  describe('Functional Component', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should catch error when exist error on ComponentDidMount event', () => {
      const Component = (props) => {
        useEffect(() => {
          // Component did mount
          functionWithError();
        }, []);
        return <div>Example Component</div>;
      };
      // to avoid react console error when error boundary throw error
      const spyReactConsoleError = jest.spyOn(console, 'error');
      spyReactConsoleError.mockImplementation(() => {});
      const spyComponentDidCatch = jest.spyOn(ErrorHandlerComponent.prototype, 'componentDidCatch');
      const ComponentWithErrorHandler = withErrorHandler(Component);
      expect(() => render(<ComponentWithErrorHandler />)).not.toThrowError();
      expect(spyComponentDidCatch).toHaveBeenCalledTimes(1);
      expect(spyComponentDidCatch).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
      spyReactConsoleError.mockRestore();
      spyComponentDidCatch.mockRestore();
    });

    it.skip('should catch error when exist error on ComponentWillUnmount event', () => {
      const Component = (props) => {
        useLayoutEffect(() => {
          return () => functionWithError();
        }, []);
        return <div>Example Component</div>;
      };
      // to avoid react console error when error boundary throw error
      const spyReactConsoleError = jest.spyOn(console, 'error');
      spyReactConsoleError.mockImplementation(() => {});
      const spyComponentDidCatch = jest.spyOn(ErrorHandlerComponent.prototype, 'componentDidCatch');
      const ComponentWithErrorHandler = withErrorHandler(Component);
      expect(() => render(<ComponentWithErrorHandler />)).not.toThrowError();
      expect(spyComponentDidCatch).toHaveBeenCalledTimes(1);
      expect(spyComponentDidCatch).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
      spyReactConsoleError.mockRestore();
      spyComponentDidCatch.mockRestore();
    });

    it('should catch error when exist error on ComponentDidUpdate event', () => {
      const Component = (props) => {
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
      spyComponentDidCatch.mockRestore();
    });

    it.skip('should catch error when exist error on user event', () => {
      const Component = (props) => {
        return (
          <div>
            <button onClick={() => functionWithError()}>Button With Error</button>
            Example Component
          </div>
        );
      };
      const spyComponentDidCatch = jest.spyOn(ErrorHandlerComponent.prototype, 'componentDidCatch');
      const ComponentWithErrorHandler = withErrorHandler(Component);
      const { getByRole } = render(<ComponentWithErrorHandler />);
      debug();
      const btnWithError = getByRole('button');

      try {
        fireEvent.click(btnWithError);
      } catch (error) {
        console.log('error catch', error);
        expect(spyComponentDidCatch).toHaveBeenCalledTimes(0);
      }
    });
  });
});
