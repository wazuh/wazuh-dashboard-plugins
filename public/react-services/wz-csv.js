/*
 * Wazuh app - API request service
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzRequest } from './wz-request';
import * as FileSaver from '../services/file-saver';

/**
 * Generates a CSV through the given data
 * @param {String} path
 * @param {Array} filters
 * @param {String} exportName
 */
const exportCsv = async (path, filters = [], exportName = 'data') => {
  try {
    const data = await WzRequest.csvReq(path, filters);
    const output = data.data ? [data.data] : [];
    const blob = new Blob(output, { type: 'text/csv' });
    FileSaver.saveAs(blob, `${exportName}.csv`);
  } catch (error) {
    return Promise.reject(error);
  }
};

export default exportCsv;
