import { getCore } from '../../public/kibana-services'; //TODO: eplace with the corresponding 
import axios from 'axios';

let allow = true;
let aborts = [];
let currentid = 0;

const removeController = (id) => {
    const index = aborts.findIndex(object => {
        return object.id === id;
    });
    if (!id) {
        return;
    }
    aborts.splice(index);
    return;
}

export const disableRequests = () => {
    console.log('Disabling requests')
    allow = false;
    aborts.forEach(item => {
      console.log('aborting request with id',item.id)
        item.controller.abort();
    })
    return;
}

export const initializeInterceptor = () => {
  console.log('interceptor initialized')
    const core = getCore();
    core.http.intercept({
        responseError: (httpErrorResponse, controller) => {
            if (
                httpErrorResponse.response?.status === 401
            ) {
                disableRequests();
                setTimeout(() => window.location.reload(), 1000);
            }
        },
    });
}

export const request = async (options = '') => {
    if (!allow) {
        console.log('tried to do request', options.method, options.url, 'but requests are disabled')
        return Promise.reject('Requests are disabled');
    }
    if (!options.method | !options.url) {
        return Promise.reject("Missing parameters")
    }
    const requestId = currentid;
    currentid++;
    const abort = new AbortController();
    if (allow) {
      console.log('Doing request', options.method, options.url, 'with ID', requestId)
        try {
            aborts.push({ id: requestId, controller: abort });
            const requestData = await axios(options);
            removeController(requestId);
            return Promise.resolve(requestData);
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}