/*
 * Wazuh app - Error handler service
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

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
        if(isUnauthorized(error)){
            appState.removeUserCode();
            $location.path('/wlogin');
            return;
        }

        let text;
        text = isWarning ? `Warning. ${message}` : `Error. ${message}`;
        if(error.extraMessage) text = error.extraMessage;
        text = location ? location + '. ' + text : text;
        if(!silent){
            if(isWarning) notify.warning(text);
            else          notify.error(text);
        }
        return text;
    }

    return {
        handle: handle,
        info: info
    }
});
