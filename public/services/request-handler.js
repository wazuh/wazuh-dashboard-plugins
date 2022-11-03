import { getCore } from '../kibana-services';

let allow = true;
let aborts = [];
let currentid = 0;

const removeController = (id) => {
    const index = aborts.findIndex(object => {
        return object.id === id;
    });
    if(!id){
        return;
    }
    aborts.splice(index);
    return;
}

export const disableRequests = () => {
    allow = false;
    aborts.forEach(item => {
    item.controller.abort();})
    return;
}

export const initializeInterceptor = () => {
    const core = getCore();
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

export const request = async (info) => {
    if (!allow) {
        return Promise.reject();
    }

    let { method, path, headers, data, timeout } = info;
    const core = getCore();
    const url = path.split('?')[0]
    const query = Object.fromEntries([... new URLSearchParams(path.split('?')[1])])
    const abort = new AbortController();
    let options = {
        method: method,
        headers: headers,
        query: query,
        signal: abort.signal,
        id: currentid
    }
    currentid++;
    
    if (method !== 'GET') {
        options = { ...options, body: JSON.stringify(data) }
    }
    
    if (allow) {
        aborts.push({ id: options.id, controller: abort })
        try {
            if (!method | ! path){
                throw new Error("Missing parameters")
            }
            if (timeout && timeout !== 0) {
                const id = setTimeout(() => abort.abort(), timeout);
                const requestData = await core.http.fetch(url, options);
                clearTimeout(id);
                removeController(options.id);
                return Promise.resolve({ data: requestData });
            }
            else {
                const requestData = await core.http.fetch(url, options);
                removeController(options.id);
                return Promise.resolve({ data: requestData });
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}