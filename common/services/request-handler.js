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
    allow = false;
    aborts.forEach(item => {
        item.controller.abort();
    })
    return;
}

export const initializeInterceptor = (core) => {
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
        return Promise.reject('Requests are disabled');
    }
    if (!options.method | !options.url) {
        return Promise.reject("Missing parameters")
    }
    const requestId = currentid;
    currentid++;
    const abort = new AbortController();
    if (allow) {
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
