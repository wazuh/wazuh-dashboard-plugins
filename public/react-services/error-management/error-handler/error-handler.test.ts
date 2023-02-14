import { AxiosError, AxiosResponse } from 'axios';
import { ErrorHandler } from './error-handler';
import { ErrorOrchestratorService } from '../../error-orchestrator/error-orchestrator.service';
import WazuhError from '../error-factory/errors/WazuhError';

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
    message: '3099 - ERROR3099 - Wazuh not ready yet',
  },
  status: 500,
  statusText: 'Internal Server Error',
  headers: {},
  config: {},
  request: {},
};

describe('Error Handler', () => {
  describe('createError', () => {
    it.each([
      { ErrorType: Error, name: 'Error' },
      { ErrorType: TypeError, name: 'TypeError' },
      { ErrorType: EvalError, name: 'EvalError' },
      { ErrorType: ReferenceError, name: 'ReferenceError' },
      { ErrorType: SyntaxError, name: 'SyntaxError' },
      { ErrorType: URIError, name: 'URIError' },
    ])(
      'Should return the same $name instance when receive a native javascript error',
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
        name: 'ElasticApiError',
        message: '2000 - ERROR2000 - ElasticApiError',
      },
      { name: 'WazuhApiError', message: '3000 - ERROR3000 - WazuhApiError' },
      { name: 'ElasticError', message: '4000 - ERROR4000 - ElasticError' },
      {
        name: 'WazuhReportingError',
        message: '5000 - ERROR5000 - WazuhReportingError',
      },
    ])(
      'Should return the same $name instance when receive a native javascript error',
      ({ name, message }: { name: string; message: string }) => {
        let error = new Error(message) as AxiosError;
        error.response = responseBody;
        error.response.data.message = message;
        error.response.data.error = error;
        const errorCreated = ErrorHandler.createError(error);
        expect(errorCreated).toBeInstanceOf(WazuhError);
        expect(errorCreated.message).toBe(message);
        expect(errorCreated.name).toBe(name);
        expect(errorCreated.stack).toBe(error.stack);
      },
    );
  });

  describe('handleError', () => {
    it.each([
      {
        name: 'ElasticApiError',
        message: '2000 - ERROR2000 - ElasticApiError',
      },
      { name: 'WazuhApiError', message: '3000 - ERROR3000 - WazuhApiError' },
      { name: 'ElasticError', message: '4000 - ERROR4000 - ElasticError' },
      {
        name: 'WazuhReportingError',
        message: '5000 - ERROR5000 - WazuhReportingError',
      },
    ])(
      'Should return the same $name instance when receive a native javascript error',
      ({ name, message }: { name: string; message: string }) => {
        let error = new Error(message) as AxiosError;
        error.response = responseBody;
        error.response.data.message = message;
        error.response.data.error = error;
        const errorReturned = ErrorHandler.createError(error);
        ErrorHandler.handleError(error);
        const spyErrorOrch = jest.spyOn(
          ErrorOrchestratorService,
          'handleError',
        );
        expect(spyErrorOrch).toHaveBeenCalledWith({
          context: '',
          level: 'ERROR',
          severity: 'CRITICAL',
          display: true,
          error: {
            error: errorReturned,
            message,
            title: name,
          },
          store: true,
        });
      },
    );
  });

  /*
    it.only('should return error', async () => {
      const throwError = () => {
        const response = {
          statusCode: 500,
          body: {},
        };
        throw new errors.ResponseError(response as ApiResponse);
      };

      try {
        throwError();
      } catch (error) {
        console.log(JSON.stringify(error));
      }
    });


  })
  */
});
