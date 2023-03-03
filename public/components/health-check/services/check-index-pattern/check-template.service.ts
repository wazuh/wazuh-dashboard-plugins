/*
 * Wazuh app - Check template for alerts index pattern service
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
import { i18n } from '@kbn/i18n';

import {
  AppState,
  GenericRequest,
  SavedObject,
} from '../../../../react-services';
import { CheckLogger } from '../../types/check_logger';
const indexPattern = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.indexPattern',
  {
    defaultMessage: 'Index pattern id in cookie:',
  },
);
const yes = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.yes',
  {
    defaultMessage: 'yes',
  },
);
const no = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.no',
  {
    defaultMessage: 'no',
  },
);
const checkIndex = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.checkIndex',
  {
    defaultMessage: 'Checking if the index pattern id',
  },
);
const exists = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.exists',
  {
    defaultMessage: 'exists...',
  },
);
const indexId = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.indexId',
  {
    defaultMessage: 'Index pattern id',
  },
);
const found = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.found',
  {
    defaultMessage: 'found:',
  },
);
const yesTitle = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.yesTitle',
  {
    defaultMessage: 'yes title',
  },
);
const templetePattern = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.templetePattern',
  {
    defaultMessage:
      'Checking if exists a template compatible with the index pattern title',
  },
);
const templeteFound = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.templeteFound',
  {
    defaultMessage: 'Template found for the selected index-pattern title',
  },
);
const noTemplete = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.noTemplete',
  {
    defaultMessage: 'No template found for the selected index-pattern title',
  },
);
const foundNo = i18n.translate(
  'wazuh.public.components.health.check.service.pattern.template.',
  {
    defaultMessage: 'found: no',
  },
);

export const checkTemplateService = async (
  appConfig,
  checkLogger: CheckLogger,
) => {
  const patternId = AppState.getCurrentPattern();
  checkLogger.info(
    `${indexPattern} ${patternId ? `${yes} [${patternId}]` : no}`,
  );

  checkLogger.info(`${checkIndex} [${patternId}] ${exists}`);
  const patternData = patternId
    ? await SavedObject.existsIndexPattern(patternId)
    : null;
  checkLogger.info(
    `${indexId} [${patternId}] ${found} ${
      patternData.title ? `${yesTitle} [${patternData.title}]` : no
    }`,
  );

  if (patternData.title) {
    checkLogger.info(`${templetePattern} [${patternData.title}]`);
    const templateData = await GenericRequest.request(
      'GET',
      `/elastic/template/${patternData.title}`,
    );
    checkLogger.info(
      `${templeteFound} [${patternData.title}]: ${
        templateData.data.status ? yes : no
      }`,
    );
    if (!templateData.data.status) {
      checkLogger.error(`${noTemplete} [${patternData.title}]`);
    }
  } else {
    checkLogger.error(`${indexId} [${patternId}] ${foundNo}`);
  }
};
