import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import React, { Component } from 'react';
import { ErrorHandler } from '../../error-handler';
import { AxiosError, AxiosResponse } from 'axios';
import { HttpError } from '../../error-factory';
import { ErrorOrchestratorService } from '../../../error-orchestrator/error-orchestrator.service';

// mocked some required kibana-services
jest.mock('../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: (url: string) => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name: string, value: string, options: any) => {
      return true;
    },
  }),
}));

jest.mock('../../../error-orchestrator/error-orchestrator.service');

describe('Error Handler class example tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('On component when we want to log an error catched in the try-catch block', () => {
    it('When the error is a Native javascript error', () => {
      const errorMocked = new Error('new Error handled');

      class ExampleComponent extends Component {
        constructor(props: any) {
          super(props);
        }

        onClickEvent() {
          try {
            // do something
            throw errorMocked;
          } catch (error) {
            // the error handler will auto-categorize the error and log how is defined in the respective error class
            // if the error is custom (WazuhError) the handler error will return
            if (error instanceof Error) {
              ErrorHandler.handleError(error); // the error handler returns the error instance
            }
          }
        }

        render() {
          return (
            <>
              <h1>Example component</h1>
              <button onClick={this.onClickEvent}>Button</button>
            </>
          );
        }
      }

      const { container, getByRole, getByText } = render(<ExampleComponent />);
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');
      fireEvent.click(getByRole('button'));
      expect(container).toBeInTheDocument();
      expect(getByText('Example component')).toBeInTheDocument();
      expect(spyErrorOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            title: '[An error has occurred]',
            message: errorMocked.message,
            error: errorMocked,
          },
        }),
      );
    });

    it('When the error is a Http error (custom error type)', () => {
      const httpErrorBody: AxiosResponse = {
        data: {
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Server not ready yet',
        },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {
          url: '/api/request',
          data: {
            params: 'here-any-custom-params',
          }, // the data could contain the params of the request
        },
        request: {},
      };

      let errorMocked = new Error('Not found') as AxiosError;
      errorMocked.response = httpErrorBody;
      const spyIshttp = jest
        .spyOn(ErrorHandler, 'isHttpError')
        .mockImplementation(() => true);
      class ExampleComponent extends Component {
        constructor(props: any) {
          super(props);
        }

        onClickEvent() {
          try {
            // do something and throw the error
            throw errorMocked; // the error must be an http error like when use the WzRequest.genericReq || apiReq.request
          } catch (error) {
            // the error handler will auto-categorize the error and log how is defined in the respective error class
            // if the error is custom (WazuhError) the handler error will return
            if (error instanceof Error) {
              ErrorHandler.handleError(error); // the error handler returns the error instance
            }
          }
        }

        render() {
          return (
            <>
              <h1>Example component</h1>
              <button onClick={this.onClickEvent}>Button</button>
            </>
          );
        }
      }

      const { container, getByRole, getByText } = render(<ExampleComponent />);
      const createdError = ErrorHandler.createError(errorMocked) as HttpError;
      fireEvent.click(getByRole('button'));
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');
      expect(container).toBeInTheDocument();
      expect(getByText('Example component')).toBeInTheDocument();
      expect(spyErrorOrch).toBeCalledTimes(1);
      expect(spyErrorOrch).toBeCalledWith(
        expect.objectContaining({ error: createdError.logOptions.error }),
      );
      spyErrorOrch.mockRestore();
      spyIshttp.mockRestore();
    });

    it('When we want to set a "Custom title and message"', () => {
      const errorMocked = new Error('new Error handled');

      class ExampleComponent extends Component {
        constructor(props: any) {
          super(props);
        }

        onClickEvent() {
          try {
            // do something
            throw errorMocked;
          } catch (error) {
            // the error handler will auto-categorize the error and log how is defined in the respective error class
            // if the error is custom (WazuhError) the handler error will return
            if (error instanceof Error) {
              ErrorHandler.handleError(error, {
                title: 'An error on event click has occurred',
                message: `Check the following error: ${error.message}`,
              }); // the error handler returns the error instance
            }
          }
        }

        render() {
          return (
            <>
              <h1>Example component</h1>
              <button onClick={this.onClickEvent}>Button</button>
            </>
          );
        }
      }

      const { container, getByRole, getByText } = render(<ExampleComponent />);
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');
      fireEvent.click(getByRole('button'));
      expect(container).toBeInTheDocument();
      expect(getByText('Example component')).toBeInTheDocument();
      expect(spyErrorOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            title: 'An error on event click has occurred',
            message: `Check the following error: ${errorMocked.message}`,
            error: errorMocked,
          },
        }),
      );
    });
    it('When we want to handle a created error in the try-catch block', () => {
      const errorMocked = new Error('new Error handled');
      const errorCreated = new TypeError('An custom error has occurred');
      class ExampleComponent extends Component {
        constructor(props: any) {
          super(props);
        }

        onClickEvent() {
          try {
            // do something
            throw errorMocked;
          } catch (error) {
            // the error handler will auto-categorize the error and log how is defined in the respective error class
            // if the error is custom (WazuhError) the handler error will return
            if (error instanceof Error) {
              ErrorHandler.handleError(errorCreated, {
                title: 'An error when click on button has occurred',
                message: 'Check the error details in the "Full error" section',
              }); // the error handler returns the error instance
            }
          }
        }

        render() {
          return (
            <>
              <h1>Example component</h1>
              <button onClick={this.onClickEvent}>Button</button>
            </>
          );
        }
      }

      const { container, getByRole, getByText } = render(<ExampleComponent />);
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');
      fireEvent.click(getByRole('button'));
      expect(container).toBeInTheDocument();
      expect(getByText('Example component')).toBeInTheDocument();
      expect(spyErrorOrch).toHaveBeenCalledWith(
        expect.objectContaining({
          error: {
            title: 'An error when click on button has occurred',
            message: 'Check the error details in the "Full error" section',
            error: errorCreated,
          },
        }),
      );
      expect(errorCreated).toBeInstanceOf(TypeError);
    });
  });
});
