/*
 * Wazuh app - Module for logging functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { BaseLogger } from './base-logger';
import {
  WAZUH_DATA_LOGS_PLAIN_FILENAME,
  WAZUH_DATA_LOGS_RAW_FILENAME,
} from '../../common/constants';

const logger = new BaseLogger(WAZUH_DATA_LOGS_PLAIN_FILENAME, WAZUH_DATA_LOGS_RAW_FILENAME);

export const log = (location, message, level) => {
  logger.log(location, message, level);
};
