import { AxiosError, AxiosResponse } from 'axios';
import { ErrorHandler } from './error-handler';
import { ErrorOrchestratorService } from '../../error-orchestrator/error-orchestrator.service';
import WazuhError from '../error-factory/errors/WazuhError';
import { UIErrorLog } from '../../error-orchestrator/types';

// mocked some required kibana-services
jest.mock('../../../kibana-services', () => ({
  ...(jest.requireActual('../../../kibana-services') as object),
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

jest.mock('../../error-orchestrator/error-orchestrator.service');

const responseBody: AxiosResponse = {
  data: {
    statusCode: 500,
    error: 'Internal Server Error',
    message: '3099 - ERROR3099 - Server not ready yet',
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

describe('Error Handler', () => {
  beforeAll(() => {
    jest.clearAllMocks();
  });
  describe('createError', () => {
    it.each([
      { ErrorType: Error, name: 'Error' },
      { ErrorType: TypeError, name: 'TypeError' },
      { ErrorType: EvalError, name: 'EvalError' },
      { ErrorType: ReferenceError, name: 'ReferenceError' },
      { ErrorType: SyntaxError, name: 'SyntaxError' },
      { ErrorType: URIError, name: 'URIError' },
    ])(
      'should preserve and return the same "$name" instance when receive a native javascript error',
      ({ ErrorType, name }: { ErrorType: ErrorConstructor; name: string }) => {
        const errorTriggered = new ErrorType(`${name} error test`);
        const error = ErrorHandler.createError(errorTriggered);
        expect(error).toBeInstanceOf(ErrorType);
        expect(error.name).toEqual(name);
        expect(error.stack).toEqual(errorTriggered.stack);
      },
    );

    it.each([
      {
        name: 'IndexerApiError',
        message: 'Error IndexerApiError',
        url: '/elastic/samplealerts',
      },
      {
        name: 'WazuhApiError',
        message: 'Error WazuhApiError',
        url: '/api/request',
      },
      {
        name: 'WazuhReportingError',
        message: 'Error WazuhReportingError',
        url: '/reports',
      },
      {
        name: 'HttpError',
        url: '/any/url',
        message: 'Error HttpError',
      },
    ])(
      'should created a new "$name" instance when receive a native javascript error when is an http error',
      ({
        name,
        message,
        url,
      }: {
        name: string;
        message: string;
        url: string;
      }) => {
        let error = new Error(message) as AxiosError;
        error.response = responseBody;
        error.response.data.message = message;
        error.response.data.error = error;
        error.response.config.url = url;
        const spyIshttp = jest
          .spyOn(ErrorHandler, 'isHttpError')
          .mockImplementation(() => true);
        const errorCreated = ErrorHandler.createError(error);
        expect(errorCreated).toBeInstanceOf(WazuhError);
        expect(errorCreated.message).toBe(message);
        expect(errorCreated.name).toBe(name);
        expect(errorCreated.stack).toBe(error.stack);
        spyIshttp.mockRestore();
      },
    );
  });

  describe('handleError', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it('should send the error to the ERROR ORCHESTRATOR service with custom log options when is defined', () => {
      const mockedError = new Error('Mocked error');
      ErrorHandler.handleError(mockedError, {
        title: 'Custom title',
        message: 'Custom message',
      });
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');

      let logOptionsExpected = {
        error: {
          title: 'Custom title',
          message: 'Custom message',
          error: mockedError,
        },
      };
      expect(spyErrorOrch).toHaveBeenCalledWith(
        expect.objectContaining(logOptionsExpected),
      );
      spyErrorOrch.mockRestore();
    });

    it.each([
      {
        name: 'IndexerApiError',
        message: 'Error IndexerApiError',
        url: '/elastic/samplealerts',
      },
      {
        name: 'WazuhApiError',
        message: 'Error WazuhApiError',
        url: '/api/request',
      },
      {
        name: 'WazuhReportingError',
        message: 'Error WazuhReportingError',
        url: '/reports',
      },
      {
        name: 'HttpError',
        url: '/any/url',
        message: 'Error HttpError',
      },
      { ErrorType: Error, name: 'Error', message: 'Error' },
      { ErrorType: TypeError, name: 'TypeError', message: 'Error TypeError' },
      { ErrorType: EvalError, name: 'EvalError', message: 'Error EvalError' },
      {
        ErrorType: ReferenceError,
        name: 'ReferenceError',
        message: 'Error ReferenceError',
      },
      {
        ErrorType: SyntaxError,
        name: 'SyntaxError',
        message: 'Error SyntaxError',
      },
      { ErrorType: URIError, name: 'URIError', message: 'Error URIError' },
    ])(
      'should send the "$name" instance to the ERROR ORCHESTRATOR service with the correct log options defined in the error class',
      ({
        ErrorType,
        name,
        message,
        url,
      }: {
        ErrorType?: ErrorConstructor;
        name: string;
        message: string;
        url?: string;
      }) => {
        let error;
        let spyIshttp = jest.spyOn(ErrorHandler, 'isHttpError');
        if (ErrorType) {
          spyIshttp = jest
            .spyOn(ErrorHandler, 'isHttpError')
            .mockImplementation(() => false);
          error = new ErrorType(message);
        } else {
          spyIshttp = jest
            .spyOn(ErrorHandler, 'isHttpError')
            .mockImplementation(() => true);
          error = new Error(message) as AxiosError;
          error.response = responseBody;
          error.response.data.message = message;
          error.response.data.error = error;
          error.response.config.url = url;
        }
        const errorHandled = ErrorHandler.handleError(error);
        const spyErrorOrch = jest.spyOn(
          ErrorOrchestratorService,
          'handleError',
        );

        let logOptionsExpected: UIErrorLog = {
          error: {
            title: '[An error has occurred]',
            message: error.message,
            error: errorHandled,
          },
          level: 'ERROR',
          severity: 'UI',
          display: true,
          store: false,
        };
        if (errorHandled instanceof WazuhError) {
          logOptionsExpected = errorHandled.logOptions;
        }
        expect(spyErrorOrch).toBeCalledTimes(1);
        expect(spyErrorOrch).toHaveBeenCalledWith(logOptionsExpected);
        spyIshttp.mockRestore();
        spyErrorOrch.mockRestore();
      },
    );

    it.each([
      {
        name: 'IndexerApiError',
        message: 'Error IndexerApiError',
        url: '/elastic/samplealerts',
      },
      {
        name: 'WazuhApiError',
        message: 'Error WazuhApiError',
        url: '/api/request',
      },
      {
        name: 'WazuhReportingError',
        message: 'Error WazuhReportingError',
        url: '/reports',
      },
      {
        name: 'HttpError',
        url: '/any/url',
        message: 'Error HttpError',
      },
      { ErrorType: Error, name: 'Error', message: 'Error' },
      { ErrorType: TypeError, name: 'TypeError', message: 'Error TypeError' },
      { ErrorType: EvalError, name: 'EvalError', message: 'Error EvalError' },
      {
        ErrorType: ReferenceError,
        name: 'ReferenceError',
        message: 'Error ReferenceError',
      },
      {
        ErrorType: SyntaxError,
        name: 'SyntaxError',
        message: 'Error SyntaxError',
      },
      { ErrorType: URIError, name: 'URIError', message: 'Error URIError' },
    ])(
      'should return the created "$name" instance after handle the error',
      ({
        ErrorType,
        name,
        message,
        url,
      }: {
        ErrorType?: ErrorConstructor;
        name: string;
        message: string;
        url?: string;
      }) => {
        let error;
        let spyIshttp = jest.spyOn(ErrorHandler, 'isHttpError');
        if (ErrorType) {
          spyIshttp = jest
            .spyOn(ErrorHandler, 'isHttpError')
            .mockImplementation(() => false);
          error = new ErrorType(message);
        } else {
          spyIshttp = jest
            .spyOn(ErrorHandler, 'isHttpError')
            .mockImplementation(() => true);
          error = new Error(message) as AxiosError;
          error.response = responseBody;
          error.response.data.message = message;
          error.response.data.error = error;
          error.response.config.url = url;
        }
        const errorReturned = ErrorHandler.createError(error);
        const errorFromHandler = ErrorHandler.handleError(error);
        expect(errorFromHandler).toEqual(errorReturned);
        expect(errorFromHandler).toBeInstanceOf(
          ErrorType ? ErrorType : WazuhError,
        );
        expect(errorFromHandler.message).toBe(message);
        expect(errorFromHandler.name).toBe(name);
        spyIshttp.mockRestore();
      },
    );
  });
});
