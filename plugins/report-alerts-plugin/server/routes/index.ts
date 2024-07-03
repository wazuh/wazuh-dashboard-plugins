/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import registerReportRoute from './report';
import registerReportDefinitionRoute from './reportDefinition';
import registerReportSourceRoute from './reportSource';
import registerMetricRoute from './metric';
import registerNotificationRoute from './notifications';
import registerTesseractRoute from './tesseract';
import { IRouter } from '../../../../src/core/server';
import { ReportingConfig } from 'server/config/config';

export default function (router: IRouter, config: ReportingConfig) {
  registerReportRoute(router, config);
  registerReportDefinitionRoute(router, config);
  registerReportSourceRoute(router);
  registerMetricRoute(router);
  registerNotificationRoute(router);
  registerTesseractRoute(router);
}
