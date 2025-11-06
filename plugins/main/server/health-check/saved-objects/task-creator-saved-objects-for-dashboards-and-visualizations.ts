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

function toSentenceCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function isSavedObjectPresent(
  client: SavedObjectsClientContract,
  type: 'visualization' | 'dashboard',
  id: string,
  logger: InitializationTaskRunContext['logger'],
): Promise<boolean> {
  try {
    const existing: SavedObject = await client.get(type, id);
    if (existing) {
      logger.info(
        `${toSentenceCase(type)} already exists [${existing.id}] title [${
          existing.attributes?.title
        }] - skipping`,
      );
      return !!existing.id;
    }
  } catch (error) {
    const status =
      (error as any)?.output?.statusCode ?? (error as any)?.statusCode;
    if (status !== 404) {
      throw error;
    }
  }
  return false;
}

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

  // If the visualization with that ID exists, do not overwrite it
  const existingVisId = await isSavedObjectPresent(
    client,
    'visualization',
    id,
    logger,
  );
  if (existingVisId) return existingVisId;

  const savedVisualizationResult = await client.create(
    'visualization',
    attributes,
    {
      id,
      overwrite: false,
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

  // If the dashboard with that ID exists, do not overwrite it
  const existingDashId = await isSavedObjectPresent(
    client,
    'dashboard',
    id,
    logger,
  );
  if (existingDashId) return existingDashId;

  const res = await client.create('dashboard', attributes, {
    id,
    overwrite: false,
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
