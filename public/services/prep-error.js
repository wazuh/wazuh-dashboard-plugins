/*
 * Wazuh app - Module for error messages
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default err => {

    if (err.data && err.data === 'request_timeout_genericreq' && err.url) {
        err['html'] = `The request to ${err.url} took too long and was aborted.`;
        err.message = `The request to ${err.url} took too long and was aborted.`;
    } else if (parseInt(err.error) < 0) {
        err['html'] = `Unexpected error located on controller. Error: <b>${err.message} (code ${err.error})</b>.`;
        err.message = `Unexpected error located on controller. Error: ${err.message} (code ${err.error}).`;
    } else if (parseInt(err.error) === 1) {
        err['html'] = "<b>Error getting credentials</b> for Wazuh API. Please, check credentials at settings tab.";
        err.message = "Error getting credentials for Wazuh API. Please, check credentials at settings tab.";
    } else if (parseInt(err.error) === 2) {
        err['html'] = "<b>Error getting credentials</b> for Wazuh API. Could not connect with Elasticsearch.";
        err.message = "Error getting credentials for Wazuh API. Could not connect with Elasticsearch.";
    } else if (parseInt(err.error) < 5) {
        err['html'] = `Unexpected error located on Kibana server. Error: <b>${err.message} (code ${err.error})</b>.`;
        err.message = `Unexpected error located on Kibana server. Error: ${err.message} (code ${err.error}).`;
    } else if (parseInt(err.error) === 5) {
        err['html'] = `Could not connect with Wazuh API. Error: ${err.errorMessage}.</br> Please, check the URL at settings tab.`;
        err.message = `Could not connect with Wazuh API. Error: ${err.errorMessage}. Please, check the URL at settings tab.`;
    } else if (parseInt(err.error) === 6) {
        if (err.errorData.statusCode && err.errorData.statusCode === '404') {
            err['html'] = "Wazuh API URL could not be found on elasticsearch. Please, configure the application properly.";
            err.message = "Wazuh API URL could not be found on elasticsearch. Please, configure the application properly.";
        } else {
            err['html'] = `Wazuh API returned an error message. Error: <b>${err.errorData.message}</b>`;
            err.message = `Wazuh API returned an error message. Error: ${err.errorData.message}`;
        }
    } else if (parseInt(err.error) === 7) {
        err['html'] = `Unexpected error filtering the data. Error <b>${err.message}</b>.`;
        err.message = `Unexpected error filtering the data. Error ${err.message}.`;
    } else if (err.message) {
        err['html'] = err.message;
    }

    return err;
};
