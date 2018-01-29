const app = require('ui/modules').get('app/wazuh', []);

app.service('errorHandler', function ( Notifier, appState, $location) {
    const notify = new Notifier();
    
    const extractMessage = error => {
        if(error.data && error.data.errorData && error.data.errorData.message) return error.data.errorData.message;
        if(error.errorData && error.errorData.message) return error.errorData.message;
        if(error.data && typeof error.data === 'string') return error.data;
        if(error.data && error.data.message) return error.data.message;
        if(error.message) return error.message;
        if(typeof error === 'string') return error;
        if(typeof error === 'object') return JSON.stringify(error);
        return error || 'Unexpected error';
    }

    const isUnauthorized = error => (error.status && error.status === 401);
    const isNotFound     = error => (error.status && error.status === 404);
    const isHttps        = error => (typeof error.https !== 'undefined');
    const isBadRequest   = error => (error.status && error.status === 400);
    
    const handle = (error,isWarning) => {
        const message = extractMessage(error);
        if(isUnauthorized(error)){
            appState.removeUserCode();
            $location.path('/login');
            return;
        }

        let text;
        switch (message) {
            case 'no_elasticsearch':
                text = 'Could not connect with elasticsearch in order to retrieve the credentials.';
                break;
            case 'no_credentials':
                text = 'Valid credentials not found in elasticsearch. It seems the credentials ' +
                       'were not saved.';
                break;
            case 'protocol_error':
                text = 'Invalid protocol in the API url. Please, specify <b>http://</b> or ' +
                       '<b>https://</b>.';
                break;
            case 'unauthorized':
                text = 'Credentials were found, but they are not valid.';
                break;
            case 'bad_url':
                text = 'The given URL does not contain a valid Wazuh RESTful API installation.';
                break;
            case 'self_signed':
                text = 'The request to Wazuh RESTful API was blocked, because it is using a ' +
                       'selfsigned SSL certificate. Please, enable <b>"Accept selfsigned SSL"</b> ' +
                       'option if you want to connect anyway.';
                break;
            case 'not_running':
                text = 'There are not services running in the given URL.';
                break;
            case 'request_timeout_checkstored':
                text = 'The request to /api/wazuh-api/checkStoredAPI took too long and was aborted.';
                break;
            case 'request_timeout_checkapi':
                text = 'The request to /api/wazuh-api/checkAPI took too long and was aborted.';
                break;
            case 'wrong_credentials':
                text = 'Wrong Wazuh API credentials, please check them and try again';
                break;
            case 'invalid_url':
                text = 'Wrong Wazuh API url, please check it and try again';
                break;
            case 'invalid_port':
                text = 'Wrong Wazuh API port, please check it and try again';
                break;
            case 'socket_hang_up':
                if(error.https){
                    text = 'Wrong Wazuh API protocol, please check it and try again with http instead https';
                } else {
                    text = 'Could not connect with Wazuh API, please check url and port and try again'
                }
                break;
            default:
                text = `Error. ${message}`;
        }

        if(isWarning) notify.warning(text);
        else          notify.error(text);

        return text;
    }

    return {
        handle: handle
    }
});