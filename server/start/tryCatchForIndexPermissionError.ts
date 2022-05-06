/*
 * Wazuh app - HOF to manage the message when elastic show a Response error / security_exception
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { log } from '../lib/logger';

export const tryCatchForIndexPermissionError = (wazuhIndex: string) => (functionToTryCatch) => async () => {
    try {
        await functionToTryCatch();
    }
    catch (error) {
        enum errorTypes{
            SECURITY_EXCEPTION = 'security_exception',
            RESPONSE_ERROR = 'Response Error',
        }
        switch(error.message){
            case errorTypes.SECURITY_EXCEPTION:
              error.message = (((((error.meta || error.message).body || error.message).error || error.message).root_cause[0] || error.message).reason || error.message);
              break;
            case errorTypes.RESPONSE_ERROR:
              error.message = `Could not check if the index ${
                wazuhIndex
              } exists due to no permissions for create, delete or check`;
              break;
        }
        return Promise.reject(error);
    }
}