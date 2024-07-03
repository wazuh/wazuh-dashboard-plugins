/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart, IUiSettingsClient } from '../../../../../src/core/public';

let uiSettings: IUiSettingsClient;
let http: HttpStart;

export const uiSettingsService = {
  init: (uiSettingsClient: IUiSettingsClient, httpClient: HttpStart) => {
    uiSettings = uiSettingsClient;
    http = httpClient;
  },
  get: (key: string, defaultOverride?: any) => {
    return uiSettings?.get(key, defaultOverride) || '';
  },
  getSearchParams: function () {
    const rawTimeZone = this.get('dateFormat:tz');
    const timezone =
      !rawTimeZone || rawTimeZone === 'Browser'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : rawTimeZone;
    const dateFormat = this.get('dateFormat');
    const csvSeparator = this.get('csv:separator');
    const allowLeadingWildcards = this.get('query:allowLeadingWildcards');
    return {
      timezone,
      dateFormat,
      csvSeparator,
      allowLeadingWildcards,
    };
  },
  getHttpClient: () => http,
};
