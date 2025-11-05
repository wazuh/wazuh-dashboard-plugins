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
  DashboardByRendererInput,
  SavedVis,
} from '../../../common/dashboards';
import { DashboardSavedObjectMapper } from './dashboard-saved-object-mapper';
import { getDashboardConfigs } from './dashboard-configs';

// ---------- Transform helpers ----------

function toVisualizationAttributes(savedVis: SavedVis) {
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

async function saveVisualizationAsSavedObject(
  client: SavedObjectsClientContract,
  savedVis: SavedVis,
  logger: InitializationTaskRunContext['logger'],
) {
  const id = savedVis.id;
  const { attributes, references } = toVisualizationAttributes(savedVis);

  logger.debug(`Creating/updating visualization [${id}]`);

  // TODO: If the visualization with that ID exists, do not overwrite it

  const savedVisualizationResult = await client.create(
    'visualization',
    attributes,
    {
      id,
      overwrite: true,
      refresh: true,
      references,
    },
  );

  logger.info(
    `Visualization ensured [${savedVisualizationResult.id}] title [${savedVisualizationResult.attributes.title}]`,
  );
  return savedVisualizationResult;
}

async function saveDashboardAsSavedObject(
  client: SavedObjectsClientContract,
  dashboard: DashboardByRendererInput,
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

        const dashboardConfigs = getDashboardConfigs();

        for (const dashboardConfig of dashboardConfigs) {
          // Create visualizations
          await Promise.all(
            dashboardConfig
              .getSavedVisualizations()
              .map(savedVis =>
                saveVisualizationAsSavedObject(client, savedVis, ctx.logger),
              ),
          );

          await saveDashboardAsSavedObject(
            client,
            dashboardConfig.getConfig(),
            dashboardConfig.getSavedVisualizationsIds(),
            ctx.logger,
          );
        }

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
