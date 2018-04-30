/*
 * Wazuh app - Generic error response constructor
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Error codes:
 * wazuh-api-elastic 20XX
 * wazuh-api         30XX
 * wazuh-elastic     40XX
 * unknown           1000
 */
export default (message = null, code = null, statusCode = null, res) => {
    return res({
        message: typeof message === 'string' ? `${code ? code : 1000} - ${message}` : `${code ? code : 1000} - Unexpected error`,
        code   : code ? code : 1000,
        statusCode: statusCode ? statusCode : 500
    })
    .code(statusCode ? statusCode : 500);
}