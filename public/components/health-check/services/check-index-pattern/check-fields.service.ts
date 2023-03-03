/*
 * Wazuh app - Check index pattern fields service
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import { AppState, SavedObject } from '../../../../react-services';
import { getDataPlugin } from '../../../../kibana-services';
import { CheckLogger } from '../../types/check_logger';
import { i18n } from '@kbn/i18n';

const indexPattern = i18n.translate(
  'wazuh.public.components.healthCheck.service.indexPattern',
  {
    defaultMessage: 'Index pattern id in cookie:',
  },
);
const gettingIndex = i18n.translate(
  'wazuh.public.components.healthCheck.service.gettingIndex',
  {
    defaultMessage: 'Getting index pattern data',
  },
);
const dataFound = i18n.translate(
  'wazuh.public.components.healthCheck.service.dataFound',
  {
    defaultMessage: 'Index pattern data found:',
  },
);
const refreshing = i18n.translate(
  'wazuh.public.components.healthCheck.service.refreshing',
  {
    defaultMessage: 'Refreshing index pattern fields: title',
  },
);
const refreshingIndex = i18n.translate(
  'wazuh.public.components.healthCheck.service.',
  {
    defaultMessage: 'Refreshed index pattern fields: title',
  },
);
export const checkFieldsService = async (
  appConfig,
  checkLogger: CheckLogger,
) => {
  const patternId = AppState.getCurrentPattern();
  checkLogger.info(`${indexPattern} [${patternId}]`);

  checkLogger.info(`${gettingIndex} [${patternId}]...`);
  const pattern = await getDataPlugin().indexPatterns.get(patternId);
  checkLogger.info(`${dataFound} [${pattern ? 'yes' : 'no'}]`);

  checkLogger.info(`${refreshing} [${pattern.title}], id [${pattern.id}]...`);
  await SavedObject.refreshIndexPattern(pattern, null);
  checkLogger.action(
    `${refreshingIndex} [${pattern.title}], id [${pattern.id}]`,
  );
};
