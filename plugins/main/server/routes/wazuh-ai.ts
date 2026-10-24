/*
 * Wazuh app - Module for SOC AI analysis routes
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */
import { WazuhAiCtrl } from '../controllers';
import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';

const MAX_AI_ALERT_BYTES = 256 * 1024;

export function WazuhAiRoutes(router: IRouter) {
  const ctrl = new WazuhAiCtrl();

  router.post(
    {
      path: '/api/ai/analyze-alert',
      validate: {
        body: schema.object({
          index: schema.string(),
          id: schema.string(),
        }),
      },
      options: {
        body: {
          maxBytes: MAX_AI_ALERT_BYTES,
        },
      },
    },
    (context, request, response) =>
      ctrl.analyzeAlert(context, request, response),
  );
}
