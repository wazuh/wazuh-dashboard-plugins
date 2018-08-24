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
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

class ErrorHandler {
    /**
     * Constructor
     * @param {*} Notifier Useful class to create toasts
     * @param {*} $location Angular.js service to manage URL routing
     */
    constructor(Notifier, $location) {
        this.$location = $location;
        this.notify = new Notifier();
    }

    /**
     * Extracts error message string from any kind of error.
     * @param {*} error 
     */
    extractMessage(error) {
        if(error && error.status && error.status === -1) return 'Server did not respond';
        if(error.data && error.data.errorData && error.data.errorData.message) return error.data.errorData.message;
        if(error.errorData && error.errorData.message) return error.errorData.message;
        if(error.data && typeof error.data === 'string') return error.data;
        if(error.data && error.data.error && typeof error.data.error === 'string') return error.data.error;
        if(error.data && error.data.message && typeof error.data.message === 'string') return error.data.message;
        if(error.data && error.data.message && error.data.message.msg && typeof error.data.message.msg === 'string') return error.data.message.msg;
        if(error.data && error.data.data && typeof error.data.data === 'string') return error.data.data;
        if(typeof error.message === 'string') return error.message;
        if(error.message && error.message.msg) return error.message.msg;
        if(typeof error === 'string') return error;
        if(typeof error === 'object') return JSON.stringify(error);
        return error || 'Unexpected error';
    }

    /**
     * Returns true/false depending on the error content. It looks for unauthorized error.
     * @param {*} error 
     */
    isAPIUnauthorized(error){
        return (error && error.data && parseInt(error.data.statusCode) === 500 && parseInt(error.data.error) === 7 && error.data.message === '401 Unauthorized');
    }

    /**
     * Fires a green toast (success toast) using given message
     * @param {string} message The message to be shown
     * @param {string} location Usually means the file where this method was called
     */
    info(message,location) {
        if(typeof message === 'string') {
            message = location ? location + '. ' + message : message;
            this.notify.custom(message,{ title: 'Information', icon: 'info', type: 'info'});
        }
        return;
    }

    /**
     * Main method to show error, warning or info messages
     * @param {*} error 
     * @param {string} location Usually means the file where this method was called
     * @param {boolean} isWarning If true, the toast is yellow 
     * @param {boolean} silent If true, no message is shown 
     */
    handle(error,location,isWarning,silent) {
        if(this.isAPIUnauthorized(error)){
            this.$location.path('/settings');
            return;
        }
        
        const message = this.extractMessage(error);

        let text;
        text = isWarning ? `Warning. ${message}` : `Error. ${message}`;
        if(error.extraMessage) text = error.extraMessage;
        text = location ? location + '. ' + text : text;
        if(!silent){
            if(isWarning || (text && typeof text === 'string' && text.toLowerCase().includes('no results'))) this.notify.warning(text);
            else          this.notify.error(text);
        }
        return text;
    }

}

app.service('errorHandler', ErrorHandler);