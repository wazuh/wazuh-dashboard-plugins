/*
 * Wazuh app - Health check task for creating saved objects (visualizations and dashboards)
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

// NOTE: This module creates saved objects for a subset of the dashboards currently rendered
// "by value" in the UI. The goal is to provision equivalent "by reference" objects on the
// server, so the UI can later switch to use saved object references seamlessly.
//
// Whenever possible, custom IDs are used for predictable identification.

import type { SavedObjectsClientContract } from 'opensearch_dashboards/server';
import type { InitializationTaskRunContext } from '../services';
import type {
  DashboardByValueInput,
  DashboardByValueSavedVis,
} from '../../../common/dashboards/types';
import { WelcomeDashboardByRendererConfig } from '../../../common/dashboards/welcome/dashboard';
import { INDEX_PATTERN_REPLACE_ME } from './constants';
import { DashboardSavedObjectMapper } from './dashboard-saved-object-mapper';

// ---------- Transform helpers ----------

function toVisualizationAttributes(savedVis: DashboardByValueSavedVis) {
  // Kibana/OSD visualization SO expects `visState` with `aggs`, and the search source under `kibanaSavedObjectMeta`.
  const visState = {
    title: savedVis.title,
    type: savedVis.type,
    params: savedVis.params ?? {},
    aggs: savedVis.data?.aggs ?? [],
  };

  const attributes = {
    title: savedVis.title,
    visState: JSON.stringify(visState),
    uiStateJSON: JSON.stringify(savedVis.uiState ?? {}),
    description: '',
    version: 1,
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify(savedVis.data?.searchSource ?? {}),
    },
  };

  const references = savedVis.data?.references ?? [];

  return { attributes, references };
}

async function saveVisualizationSavedObject(
  client: SavedObjectsClientContract,
  savedVis: DashboardByValueSavedVis,
  logger: InitializationTaskRunContext['logger'],
) {
  const id = savedVis.id;
  const { attributes, references } = toVisualizationAttributes(savedVis);

  logger.debug(`Creating/updating visualization [${id}]`);

  const res = await client.create('visualization', attributes, {
    id,
    overwrite: true,
    refresh: true,
    references,
  });

  logger.info(
    `Visualization ensured [${res.id}] title [${res.attributes.title}]`,
  );
  return res.id;
}

function buildDashboardPanelsJSON(
  order: Array<{
    panelId: string;
    gridData: { w: number; h: number; x: number; y: number; i: string };
  }>,
) {
  // Use reference-based panels to avoid embedding saved object ids directly.
  return order.map((panel, idx) => ({
    gridData: panel.gridData,
    version: '7.10.0',
    type: 'visualization',
    panelRefName: `panel_${idx}`,
    embeddableConfig: {},
  }));
}

async function saveDashboardSavedObject(
  client: SavedObjectsClientContract,
  dashboard: DashboardByValueInput,
  savedObjectVisualizationsIds: string[],
  logger: InitializationTaskRunContext['logger'],
) {
  const { id, attributes, references } =
    DashboardSavedObjectMapper.mapDashboardInputToSavedObject(
      dashboard,
      savedObjectVisualizationsIds,
    );

  logger.debug(`Creating/updating dashboard [${id}]`);
  const res = await client.create('dashboard', attributes, {
    id,
    overwrite: true,
    refresh: true,
    references,
  });
  logger.info(`Dashboard ensured [${res.id}] title [${res.attributes.title}]`);
  return res.id;
}

// ---------- Health check task creators ----------

export const initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations =
  () => ({
    name: 'saved-objects:dashboards',
    async run(ctx: InitializationTaskRunContext) {
      try {
        ctx.logger.debug('Starting saved objects provisioning');

        const client: SavedObjectsClientContract =
          ctx.context.services.core.savedObjects.createInternalRepository();

        // Create visualizations
        const welcomeDashboardConfig = new WelcomeDashboardByRendererConfig(
          INDEX_PATTERN_REPLACE_ME,
        );

        for (const savedVis of welcomeDashboardConfig.getSavedVisualizations()) {
          await saveVisualizationSavedObject(client, savedVis, ctx.logger);
        }

        await saveDashboardSavedObject(
          client,
          welcomeDashboardConfig.getConfig(),
          welcomeDashboardConfig.getSavedVisualizationsIds(),
          ctx.logger,
        );

        ctx.logger.debug('Saved objects provisioning finished');

        return { status: 'ok' };
      } catch (error) {
        const message = `Error provisioning saved objects: ${
          error instanceof Error ? error.message : String(error)
        }`;
        ctx.logger.error(message);
        throw new Error(message);
      }
    },
  });
