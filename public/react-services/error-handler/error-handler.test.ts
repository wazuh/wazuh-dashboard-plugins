import { AxiosResponse } from 'axios';
import ErrorHandler from './error-handler';

import { ErrorOrchestratorService } from '../error-orchestrator/error-orchestrator.service';

import { ApiResponse, errors } from '@elastic/elasticsearch';
import { ElasticApiError, ElasticError, WazuhApiError, WazuhReportingError } from './errors';
// mocked some required kibana-services
jest.mock('../../kibana-services', () => ({
  ...(jest.requireActual('../../kibana-services') as object),
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

jest.mock('../error-orchestrator/error-orchestrator.service');

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
  describe('handleError', () => {
    it('should call errorOrchestrator handlerError with the corresponing definition', () => {
      const errorResponse = new Error('Error');
      errorResponse['response'] = responseBody;
      const errorReturned = ErrorHandler.returnError(errorResponse);
      ErrorHandler.handleError(errorResponse);
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');
      expect(spyErrorOrch).toHaveBeenCalledWith({
        context: '',
        level: 'ERROR',
        severity: 'CRITICAL',
        display: true,
        error: {
          error: errorReturned,
          message: '3099 - ERROR3099 - Wazuh not ready yet',
          title: 'WazuhApiError',
        },
        store: true,
      });
    });
  });

  describe('returnError', () => {
    it('should return the same Error instance when receive a common error', () => {
      const error = ErrorHandler.returnError(new Error('test'));
      expect(error).toBeInstanceOf(Error);
    });

    it('should return an WazuhApiError instance when receive an error with specific format', () => {
      // creating an error with response property
      const errorResponse = new Error('Error');
      errorResponse['response'] = responseBody;
      const error = ErrorHandler.returnError(errorResponse);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('WazuhApiError');
      expect(error.stack).toBeDefined();
      //expect(error.stack).toContain(errorResponse.stack);
    });

    it('should return an Error instance when receive a string', () => {
      const error = ErrorHandler.returnError('test');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toEqual('Error');
      expect(error.message).toEqual('test');
    });

    it('should return and TypeError instance when receive the same error type', () => {
      const error = ErrorHandler.returnError(new TypeError('test'));
      expect(error).toBeInstanceOf(TypeError);
      expect(error.name).toEqual('TypeError');
      expect(error.message).toEqual('test');
      expect(error.stack).toBeDefined();
    });

  });

  describe('getErrorType', () => {
    it('should return an Error class if receives an string', () => {
      const error = ErrorHandler.getErrorType('test');
      const errorType = new error('test')
      expect(errorType).toBeInstanceOf(Error);
      expect(errorType.name).toEqual('Error');
      expect(errorType.message).toEqual('test');
    })

    it('should return an ElasticApiError class if receives error with code >= 2000', () => {
      const errorElastic = new Error('Error');
      errorElastic['code'] = 2000;
      const error = ErrorHandler.getErrorType(errorElastic);
      const errorType = new error('test')
      expect(errorType).toBeInstanceOf(ElasticApiError);
      expect(errorType.name).toEqual('ElasticApiError');
    })

    it('should return an WazuhApiError class if receives error with code >= 3000', () => {
      const wazuhApiError = new Error('Error');
      wazuhApiError['code'] = 3000;
      const error = ErrorHandler.getErrorType(wazuhApiError);
      const errorType = new error('test')
      expect(errorType).toBeInstanceOf(WazuhApiError);
      expect(errorType.name).toEqual('WazuhApiError');
    })

    it('should return an ElasticError class if receives error with code >= 4000', () => {
      const elasticError = new Error('Error');
      elasticError['code'] = 4000;
      const error = ErrorHandler.getErrorType(elasticError);
      const errorType = new error('test')
      expect(errorType).toBeInstanceOf(ElasticError);
      expect(errorType.name).toEqual('ElasticError');
    })

    it('should return an WazuhReportingError class if receives error with code >= 5000', () => {
      const wazuhReporting = new Error('Error');
      wazuhReporting['code'] = 5000;
      const error = ErrorHandler.getErrorType(wazuhReporting);
      const errorType = new error('test')
      expect(errorType).toBeInstanceOf(WazuhReportingError);
      expect(errorType.name).toEqual('WazuhReportingError');
    })
    
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
    */
  })
});
