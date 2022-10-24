import { getCore } from '../kibana-services';

let allow = true;

export const request = async (info) => {
    const core = getCore();

    core.http.intercept({
        responseError: (httpErrorResponse, controller) => {
            if (
                httpErrorResponse.response?.status === 401
            ) {
                allow = false;
                console.log('ERROR INTERCEPTADO', JSON.stringify(httpErrorResponse.response))
                window.location.reload();

            }
        },
    });
    let { method, path, headers, data, timeout } = info;
    const url = path.split('?')[0]
    const query = Object.fromEntries([... new URLSearchParams(path.split('?')[1])])
    let options
    if (method === 'GET') {
        options = {
            method: method,
            headers: headers,
            query: query,
        }
    }
    else {
        options = {
            method: method,
            headers: headers,
            query: query,
            body: JSON.stringify(data)
        }
    }
    if (allow) {
        try {
            const requestData = await core.http.fetch(url, options);
            console.log("REQUESTADATA",requestData)
            return Promise.resolve({ data: requestData });
        }
        catch (e) {
            return Promise.reject(e);
        }
    }

}




