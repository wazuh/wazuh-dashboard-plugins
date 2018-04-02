const app = require('ui/modules').get('app/wazuh', []);

app.service('errorHandler', function ( Notifier, appState, $location) {
    const notify = new Notifier();
    
    const extractMessage = error => {
        if(error.data && error.data.errorData && error.data.errorData.message) return error.data.errorData.message;
        if(error.errorData && error.errorData.message) return error.errorData.message;
        if(error.data && typeof error.data === 'string') return error.data;
        if(error.data && error.data.message && typeof error.data.message === 'string') return error.data.message;
        if(error.data && error.data.message && error.data.message.msg && typeof error.data.message.msg === 'string') return error.data.message.msg;
        if(error.data && error.data.data && typeof error.data.data === 'string') return error.data.data;
        if(typeof error.message === 'string') return error.message;
        if(error.message && error.message.msg) return error.message.msg;
        if(typeof error === 'string') return error;
        if(typeof error === 'object') return JSON.stringify(error);
        return error || 'Unexpected error';
    }

    const isUnauthorized = error => (error.status && error.status === 401);
    const isNotFound     = error => (error.status && error.status === 404);
    const isHttps        = error => (typeof error.https !== 'undefined' && error.https);
    const isBadRequest   = error => (error.status && error.status === 400);
    const isAPIUnauthorized = error => (error && error.data && parseInt(error.data.statusCode) === 500 && parseInt(error.data.error) === 7 && error.data.message === '401 Unauthorized');
    
    const info = (message,location) => {
        if(typeof message === 'string') {
            message = location ? location + '. ' + message : message;
            notify.info(message);
        }
        return;
    }

    const handle = (error,location,isWarning,silent) => {
        if(isAPIUnauthorized(error)){
            $location.path('/settings');
            return;
        }
        const message = extractMessage(error);
        let goSettings = false;
        if(isUnauthorized(error)){
            appState.removeUserCode();
            $location.path('/wlogin');
            return;
        }

        let text;
        switch (message) {
            case 'kibana_index_pattern_error':
                text = `There seem to be a problem with Wazuh app visualizations in Kibana, please reinstall the Wazuh app.`;
                break;
            case 'elasticsearch_down':
                text = `Could not find .kibana index on Elasticsearch or maybe Elasticsearch is down.<br>Please check it and try again.`;
                break;
            case 'no_elasticsearch':
                text = `Could not connect with elasticsearch, maybe it's down.`;
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
                goSettings = true;
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
                if(isHttps(error)){
                    text = 'Wrong Wazuh API protocol, please check it and try again with http instead https';
                } else {
                    text = 'Could not connect with Wazuh API, please check url and port and try again.'
                }
                break;
            default:
                text = isWarning ? `Warning. ${message}` : `Error. ${message}`;
        }
        if(error.extraMessage) text = error.extraMessage;
        text = location ? location + '. ' + text : text;
        if(!silent){
            if(isWarning) notify.warning(text);
            else          notify.error(text);
        }
        if(goSettings) $location.path('/settings');
        return text;
    }

    return {
        handle: handle,
        info: info
    }
});