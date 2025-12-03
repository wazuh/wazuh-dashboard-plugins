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
import { readDashboardDefinitionFiles } from './dashboard-definition-reader';
import type {
  SavedObject,
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';
import { DEFAULT_DEFINITIONS_FOLDER, DEFAULT_EXTENSION } from './constants';

function toSentenceCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function isSavedObjectPresent(
  client: SavedObjectsClientContract,
  type: 'visualization' | 'dashboard',
  id: string,
  logger: InitializationTaskRunContext['logger'],
): Promise<SavedObject | null> {
  try {
    const existing: SavedObject = await client.get(type, id);
    if (existing) {
      logger.debug(
        `${toSentenceCase(type)} already exists [${existing.id}] title [${
          existing.attributes?.title
        }] - skipping`,
      );
      return existing;
    }
  } catch (error) {
    const status =
      (error as any)?.output?.statusCode ?? (error as any)?.statusCode;
    if (status !== 404) {
      throw error;
    }
  }
  return null;
}

async function ensureVisualizationSavedObject(
  client: SavedObjectsClientContract,
  visualization: SavedObjectVisualization,
  logger: InitializationTaskRunContext['logger'],
  shouldOverwrite: boolean,
): Promise<SavedObject> {
  const { id, attributes, references = [] } = visualization;

  logger.debug(`Ensuring visualization [${id}]`);

  if (!shouldOverwrite) {
    const existingVisId = await isSavedObjectPresent(
      client,
      'visualization',
      id,
      logger,
    );
    if (existingVisId) return existingVisId;
  }

  const visualizationSavedObject = await client.create(
    'visualization',
    attributes,
    {
      id,
      overwrite: shouldOverwrite,
      refresh: true,
      references,
    },
  );

  logger.debug(
    `Visualization ensured [${visualizationSavedObject.id}] title [${visualizationSavedObject.attributes.title}]`,
  );
  return visualizationSavedObject;
}

async function ensureDashboardSavedObject(
  client: SavedObjectsClientContract,
  dashboard: SavedObjectDashboard,
  logger: InitializationTaskRunContext['logger'],
  shouldOverwrite: boolean,
) {
  const { id, attributes, references = [] } = dashboard;

  logger.debug(`Ensuring dashboard [${id}]`);

  if (!shouldOverwrite) {
    const existingDashId = await isSavedObjectPresent(
      client,
      'dashboard',
      id,
      logger,
    );
    if (existingDashId) return existingDashId;
  }

  const dashboardSavedObject = await client.create('dashboard', attributes, {
    id,
    overwrite: shouldOverwrite,
    refresh: true,
    references,
  });
  logger.debug(
    `Dashboard ensured [${dashboardSavedObject.id}] title [${dashboardSavedObject.attributes.title}]`,
  );
  return dashboardSavedObject;
}

// ---------- Health check task creators ----------

export const initializationTaskCreatorSavedObjectsForDashboardsAndVisualizations =
  () => ({
    name: 'saved-objects:dashboards',
    async run(ctx: InitializationTaskRunContext) {
      try {
        ctx.logger.debug('Starting saved objects provisioning');
        const shouldOverwrite = ctx.context.scope === 'internal-initial';

        const client: SavedObjectsClientContract =
          ctx.context.services.core.savedObjects.createInternalRepository();

        const dashboardsWithVisualizations = readDashboardDefinitionFiles({
          folderPath: DEFAULT_DEFINITIONS_FOLDER,
          extension: DEFAULT_EXTENSION,
        });

        for (const dashboardDefinition of dashboardsWithVisualizations) {
          ctx.logger.debug(
            `Processing dashboard definition file [${dashboardDefinition.relativeFilePath}]`,
          );

          await Promise.all(
            dashboardDefinition.visualizations.map(visualization =>
              ensureVisualizationSavedObject(
                client,
                visualization,
                ctx.logger,
                shouldOverwrite,
              ),
            ),
          );

          await ensureDashboardSavedObject(
            client,
            dashboardDefinition.dashboard,
            ctx.logger,
            shouldOverwrite,
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
