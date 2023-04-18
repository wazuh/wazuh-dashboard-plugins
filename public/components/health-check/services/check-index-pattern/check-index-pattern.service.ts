/*
 * Wazuh app - Check alerts index pattern service
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
import { CheckLogger } from '../../types/check_logger';
import { checkFieldsService } from './check-fields.service';
import { checkIndexPatternObjectService } from './check-index-pattern-object.service';
import { checkTemplateService } from './check-template.service';

import { checkPluginPlatformSettings } from '../../services';
import {
  PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
  PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
  PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
  WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS,
  WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS,
  WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER,
} from '../../../../../common/constants';

import { getDataPlugin } from '../../../../kibana-services';

export const checkIndexPatternService = (appConfig) => async (checkLogger: CheckLogger) => {
  await checkPattern(appConfig, checkLogger);
  await checkMaxBuckets(appConfig, checkLogger);
  await checkMetaFields(appConfig, checkLogger);
  await checkTimeFilter(appConfig, checkLogger);
};

const checkPattern = async (appConfig, checkLogger: CheckLogger) => {
  if (!appConfig.data['checks.pattern']) {
    checkLogger.info('Check [pattern]: disabled. Some minimal tasks will be done.');
  };
  await checkIndexPatternObjectService(appConfig, checkLogger);
  await checkTemplate(appConfig, checkLogger);
  await checkFields(appConfig, checkLogger);
};

const decoratorHealthCheckRunCheckEnabled = (checkKey, fn) => {
  return async (appConfig: any, checkLogger: CheckLogger) => {
    if (appConfig.data[`checks.${checkKey}`]) {
      await fn(appConfig, checkLogger);
    } else {
      checkLogger.info(`Check [${checkKey}]: disabled. Skipped.`);
    };
  }
};

const checkTemplate = decoratorHealthCheckRunCheckEnabled('template', checkTemplateService);
const checkFields = decoratorHealthCheckRunCheckEnabled('fields', checkFieldsService);

const checkMaxBuckets = decoratorHealthCheckRunCheckEnabled('maxBuckets',
  (appConfig, checkLogger) => checkPluginPlatformSettings(
    PLUGIN_PLATFORM_SETTING_NAME_MAX_BUCKETS,
    WAZUH_PLUGIN_PLATFORM_SETTING_MAX_BUCKETS
  )(appConfig)(checkLogger));

const checkMetaFields = decoratorHealthCheckRunCheckEnabled('metaFields',
  (appConfig, checkLogger) => checkPluginPlatformSettings(
    PLUGIN_PLATFORM_SETTING_NAME_METAFIELDS,
    WAZUH_PLUGIN_PLATFORM_SETTING_METAFIELDS
  )(appConfig)(checkLogger));

const checkTimeFilter = decoratorHealthCheckRunCheckEnabled('timeFilter',
  (appConfig, checkLogger) => checkPluginPlatformSettings(
    PLUGIN_PLATFORM_SETTING_NAME_TIME_FILTER,
    JSON.stringify(WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER),
    (checkLogger: CheckLogger, options: { defaultAppValue: any }) => {
      getDataPlugin().query.timefilter.timefilter.setTime(WAZUH_PLUGIN_PLATFORM_SETTING_TIME_FILTER)
        && checkLogger.action(`Timefilter set to ${JSON.stringify(options.defaultAppValue)}`);
    })(appConfig)(checkLogger));
