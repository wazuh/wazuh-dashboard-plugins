import axios from 'axios';
import { HTTP_STATUS_CODES } from '../../common/constants';

let allow = true;
export let unregisterInterceptor = () => {};
const source = axios.CancelToken.source();

const disableRequests = () => {
  allow = false;
  source.cancel('Requests cancelled');
  return;
};

export const initializeInterceptor = core => {
  unregisterInterceptor = core.http.intercept({
    responseError: (httpErrorResponse, controller) => {
      if (
        httpErrorResponse.response?.status === HTTP_STATUS_CODES.UNAUTHORIZED
      ) {
        disableRequests();
      }
    },
    request: (current, controller) => {
      if (!allow) {
        throw new Error('Disable request');
      }
    },
  });
};

export const request = async (options = {}) => {
  if (!allow) {
    return Promise.reject('Requests are disabled');
  }
  if (!options.method || !options.url) {
    return Promise.reject('Missing parameters');
  }
  options = {
    ...options,
    cancelToken: source?.token,
  };

  if (allow) {
    try {
      const requestData = await axios(options);
      return Promise.resolve(requestData);
    } catch (e) {
      /* Transform the response when the data is comming as a blob to POJO.
      Using the responseType: blob causes the response data is formatted to a blob, despite
      the response can be a json. */
      if (
        e.response?.data?.constructor?.name === 'Blob' &&
        e?.response?.headers?.['content-type']?.includes?.('application/json')
      ) {
        e.response.data = JSON.parse(await e.response.data.text());
      }
      if (
        e.response?.data?.message === 'Unauthorized' ||
        e.response?.data?.message === 'Authentication required'
      ) {
        disableRequests();
        window.location.reload();
      }
      return Promise.reject(e);
    }
  }
};
