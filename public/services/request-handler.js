import axios from 'axios';
import { HTTP_STATUS_CODES } from '../../common/constants';

let allow = true;
const cancelToken = axios.CancelToken
const source = cancelToken.source();


const disableRequests = () => {
    allow = false;
    source.cancel('Requests cancelled');
    return;
}

export const initializeInterceptor = (core) => {
    core.http.intercept({
        responseError: (httpErrorResponse, controller) => {
            if (
                httpErrorResponse.response?.status === 401
            ) {
                disableRequests();
            }
        },
    });
}

export const request = async (options = '') => {
    if (!allow) {
        return Promise.reject('Requests are disabled');
    }
    if (!options.method | !options.url) {
        return Promise.reject("Missing parameters")
    }

    options = {
        ...options, cancelToken: source.token, validateStatus: function (status) {
            return (status >= 200 && status < 300) || status === 401;
        },
    }
    if (allow) {
        try {
            const requestData = await axios(options);
            if (requestData.status === HTTP_STATUS_CODES.UNAUTHORIZED) {
                if (requestData.data.message === 'Unauthorized' || requestData.data.message === 'Authentication required') {
                    disableRequests();
                }
                throw new Error(requestData.data.message)
            }
            return Promise.resolve(requestData);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}
