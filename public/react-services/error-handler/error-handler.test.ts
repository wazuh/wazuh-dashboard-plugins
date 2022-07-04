import { AxiosResponse } from 'axios';
import ErrorHandler from './error-handler';

import { ErrorOrchestratorService } from '../error-orchestrator/error-orchestrator.service';

import { ApiResponse, errors } from '@elastic/elasticsearch';
// mocked some required kibana-services
jest.mock('../../kibana-services', () => ({
  ...(jest.requireActual('../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: (url) => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name, value, options) => {
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

/**
 * Error codes: code
 * wazuh-api-elastic 20XX
 * wazuh-api         30XX
 * wazuh-elastic     40XX
 * wazuh-reporting   50XX
 * unknown           1000
 */

// statusCode = http status code
// 200 = OK
// 201 = Created
// 202 = Accepted
// 204 = No Content
// 400 = Bad Request
// 401 = unauthorized
// 403 = forbidden
// 404 = not found
// 405 = method not allowed
// 500 = internal server error
// 501 = not implemented

describe('Error Handler', () => {
  describe('handleError', () => {
    it.only('should call handlerError', () => {
      const errorResponse = new Error('Error');
      errorResponse['response'] = responseBody;
      ErrorHandler.handleError(errorResponse);
      const spyErrorOrch = jest.spyOn(ErrorOrchestratorService, 'handleError');
      expect(spyErrorOrch).toHaveBeenCalledWith({});
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
  });
});
