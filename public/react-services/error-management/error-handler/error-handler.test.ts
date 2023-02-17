import { AxiosError, AxiosResponse } from 'axios';
import { ErrorHandler } from './error-handler';
import { ErrorOrchestratorService } from '../../error-orchestrator/error-orchestrator.service';
import WazuhError from '../error-factory/errors/WazuhError';
import {
  ElasticApiError,
  ElasticError,
  WazuhApiError,
  WazuhReportingError,
} from '../error-factory';
import { IWazuhErrorConstructor } from '../types';
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
      'should created a new "$name" instance when receive a native javascript error',
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
      }: {
        ErrorType?: ErrorConstructor;
        name: string;
        message: string;
      }) => {
        let error;
        if (ErrorType) {
          error = new ErrorType(message);
        } else {
          error = new Error(message) as AxiosError;
          error.response = responseBody;
          error.response.data.message = message;
          error.response.data.error = error;
        }
        const errorHandled = ErrorHandler.handleError(error)
        const spyErrorOrch = jest.spyOn(
          ErrorOrchestratorService,
          'handleError',
        );

        let logOptionsExpected: UIErrorLog = {
          error: {
            message: errorHandled.message,
            title: errorHandled.message,
            error: errorHandled,
          },
          level: 'ERROR',
          severity: 'UI',
          display: false,
          store: false,
        };
        if(errorHandled instanceof WazuhError){
          logOptionsExpected = errorHandled.logOptions;
        }
        expect(spyErrorOrch).toHaveBeenCalledWith(logOptionsExpected);
      },
    );

    it.each([
      {
        name: 'ElasticApiError',
        message: '2000 - ERROR2000 - ElasticApiError',
      },
      {
        name: 'WazuhApiError',
        message: '3000 - ERROR3000 - WazuhApiError',
      },
      {
        name: 'ElasticError',
        message: '4000 - ERROR4000 - ElasticError',
      },
      {
        name: 'WazuhReportingError',
        message: '5000 - ERROR5000 - WazuhReportingError',
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
      }: {
        ErrorType?: ErrorConstructor;
        name: string;
        message: string;
      }) => {
        let error;
        if (ErrorType) {
          error = new ErrorType(message);
        } else {
          error = new Error(message) as AxiosError;
          error.response = responseBody;
          error.response.data.message = message;
          error.response.data.error = error;
        }
        const errorReturned = ErrorHandler.createError(error);
        const errorFromHandler = ErrorHandler.handleError(error);
        expect(errorFromHandler).toEqual(errorReturned);
        expect(errorFromHandler).toBeInstanceOf(ErrorType ? ErrorType : WazuhError);
        expect(errorFromHandler.message).toBe(message);
        expect(errorFromHandler.name).toBe(name);
      },
    );
  });
});
