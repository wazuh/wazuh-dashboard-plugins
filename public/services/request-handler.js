import { getCore } from '../kibana-services';

let allow = true;

export const request = async (info) => {
    const core = getCore();
    core.http.intercept({
        responseError: (httpErrorResponse, controller) => {
            if (
                httpErrorResponse.response?.status === 401 && httpErrorResponse.body?.message === 'Unauthorized'
            ) {
                allow = false;
                window.location.reload();
            }
        },
    });
    let { method, path, headers, data, timeout } = info;
    const url = path.split('?')[0]
    const query = Object.fromEntries([... new URLSearchParams(path.split('?')[1])])

    let options = {
        method: method,
        headers: headers,
        query: query,
    }

    if (method !== 'GET') {
        options = { ...options, body: JSON.stringify(data) }
    }

    if (allow) {
        try {
            if (timeout && timeout !== 0) {
                const abort = new AbortController();
                const id = setTimeout(() => abort.abort(), timeout);
                options = { ...options, signal: abort.signal }
                const requestData = await core.http.fetch(url, options);
                clearTimeout(id);
                return Promise.resolve({ data: requestData });
            }
            else {
                const requestData = await core.http.fetch(url, options);
                return Promise.resolve({ data: requestData });
            }
        }
        catch (e) {
            return Promise.reject(e);
        }
    }
}




