import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import React, { Component } from 'react';
import { ErrorHandler } from '../../../error-handler';
import loglevel from 'loglevel';
import { AxiosError, AxiosResponse } from 'axios';
import { getToasts } from '../../../../../kibana-services';
import { HttpError } from '../../../error-factory';

jest.mock('../../../../../kibana-services', () => ({
  getToasts: () => ({
    addError: (mockError: string, toast: any) => {},
  }),
}));

describe('Error Handler class example tests', () => {
  it('On component when we want to log an error catched in the try-catch block when the error is a native javascript error', () => {
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

    const { debug, container, getByRole, getByText } = render(
      <ExampleComponent />,
    );
    loglevel.error = jest.fn();
    fireEvent.click(getByRole('button'));
    expect(container).toBeInTheDocument();
    expect(getByText('Example component')).toBeInTheDocument();
    expect(loglevel.error).toHaveBeenCalledWith(
      '[Unexpected error]',
      errorMocked,
    );
  });

  it('On component when we want to log an error catched in the try-catch block when the error is a http error', () => {
    const httpErrorBody: AxiosResponse = {
      data: {
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Wazuh not ready yet',
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

    //const spyToast = jest.spyOn(getToasts.prototype, 'addError');

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

    const { debug, container, getByRole, getByText } = render(
      <ExampleComponent />,
    );
    const createdError = ErrorHandler.handleError(errorMocked) as HttpError;
    fireEvent.click(getByRole('button'));
    expect(container).toBeInTheDocument();
    expect(getByText('Example component')).toBeInTheDocument();
    /*expect(spyToast).toBeCalledWith(
      createdError.logOptions.error.title,
      createdError,
    );
    expect(spyToast).toBeCalledTimes(1);
    spyIshttp.mockRestore();*/
  });
});
