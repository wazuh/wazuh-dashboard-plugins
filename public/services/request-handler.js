import axios from 'axios';

let allow = true;
const source = axios.CancelToken.source();

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
        ...options, cancelToken: source.token
    }
    if (allow) {
        try {
            const requestData = await axios(options);
            return Promise.resolve(requestData);
        }
        catch (e) {
            if (e.response?.data?.message === 'Unauthorized' || e.response?.data?.message === 'Authentication required') {
                disableRequests();
            }
            return Promise.reject(e);
        }
    }
}
