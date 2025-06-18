/*
 * Wazuh app - Time and date functions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import moment from 'moment-timezone';
import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { IUiSettingsClient } from '../../../../src/core/public';

const [getUiSettings] = createGetterSetter < IUiSettingsClient > 'UiSettings';

const getTimeZone = () => {
  const dateFormatTZ = getUiSettings().get('dateFormat:tz');
  const detectedTimezone = moment.tz.guess();

  return dateFormatTZ === 'Browser' ? detectedTimezone : dateFormatTZ;
};

export const formatUIDate = date => {
  if (typeof date !== 'string') {
    return '-';
  }

  const dateFormat = getUiSettings().get('dateFormat');
  const timezone = getTimeZone();
  const momentDate = moment(date);

  momentDate.tz(timezone);

  return momentDate.format(dateFormat);
};
