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
import type { InitializationTaskRunContext } from '../types';
import { readDashboardDefinitionFiles } from './dashboard-definition-reader';
import type {
  GenericAttributes,
  SavedObject,
  SavedObjectDashboard,
  SavedObjectVisualization,
} from './saved-object.types';
import {
  DEFAULT_DEFINITIONS_FOLDER,
  DEFAULT_EXTENSION,
  DESCRIPTION_PREFIX,
} from './constants';

// Timeouts, refused connections (503) and circuit-breaker rejections (429) usually pass.
const TRANSIENT_STATUS_CODES = new Set([429, 503]);
const RETRY_DELAYS_MS = [1000, 2000, 4000];
function getStatusCode(error: unknown): number | undefined {
  return (error as any)?.output?.statusCode ?? (error as any)?.statusCode;
}

function isTransientError(error: unknown) {
  const statusCode = getStatusCode(error);
  return statusCode !== undefined && TRANSIENT_STATUS_CODES.has(statusCode);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function withRetries<T>(
  operation: () => Promise<T>,
  logger: InitializationTaskRunContext['logger'],
  attempt = 0,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const delay = RETRY_DELAYS_MS[attempt];

    if (delay === undefined || !isTransientError(error)) {
      throw error;
    }

    logger.warn(
      `Transient error [${getErrorMessage(error)}], retrying in ${delay}ms`,
    );
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetries(operation, logger, attempt + 1);
  }
}

function toSentenceCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Returns the attributes with `description` guaranteed to start with the
 * required "Provided by Wazuh. " prefix, so the provisioned saved objects can
 * be reliably targeted by filters regardless of what the source `.ndjson`
 * file contains. The original attributes are not mutated, and the operation is
 * idempotent (a description that already has the prefix is returned unchanged).
 */
function withDescriptionPrefix<T extends GenericAttributes>(attributes: T): T {
  const { description } = attributes;

  if (
    typeof description === 'string' &&
    description.startsWith(DESCRIPTION_PREFIX)
  ) {
    return attributes;
  }

  return {
    ...attributes,
    description:
      DESCRIPTION_PREFIX + (typeof description === 'string' ? description : ''),
  };
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
    if (getStatusCode(error) !== 404) {
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
    withDescriptionPrefix(attributes),
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

  const dashboardSavedObject = await client.create(
    'dashboard',
    withDescriptionPrefix(attributes),
    {
      id,
      overwrite: shouldOverwrite,
      refresh: true,
      references,
    },
  );
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

        shouldOverwrite
          ? ctx.logger.info('Initializing/overwriting saved objects')
          : ctx.logger.info('Initializing missing saved objects');

        const client: SavedObjectsClientContract =
          ctx.context.services.core.savedObjects.createInternalRepository();

        const dashboardsWithVisualizations = readDashboardDefinitionFiles({
          folderPath: DEFAULT_DEFINITIONS_FOLDER,
          extension: DEFAULT_EXTENSION,
        });

        const failures: { file: string; error: string }[] = [];

        // A non-transient failure must not skip the files after it.
        for (const [
          index,
          dashboardDefinition,
        ] of dashboardsWithVisualizations.entries()) {
          ctx.logger.debug(
            `Processing dashboard definition file [${dashboardDefinition.relativeFilePath}]`,
          );

          try {
            await Promise.all(
              dashboardDefinition.visualizations.map(visualization =>
                withRetries(
                  () =>
                    ensureVisualizationSavedObject(
                      client,
                      visualization,
                      ctx.logger,
                      shouldOverwrite,
                    ),
                  ctx.logger,
                ),
              ),
            );

            await withRetries(
              () =>
                ensureDashboardSavedObject(
                  client,
                  dashboardDefinition.dashboard,
                  ctx.logger,
                  shouldOverwrite,
                ),
              ctx.logger,
            );
          } catch (error) {
            const message = getErrorMessage(error);
            ctx.logger.error(
              `Error provisioning dashboard definition file [${dashboardDefinition.relativeFilePath}]: ${message}`,
            );
            failures.push({
              file: dashboardDefinition.relativeFilePath,
              error: message,
            });

            // Stop so the dashboard start is not held; the scheduled run creates the rest.
            if (isTransientError(error)) {
              dashboardsWithVisualizations
                .slice(index + 1)
                .forEach(({ relativeFilePath }) =>
                  failures.push({
                    file: relativeFilePath,
                    error: 'Not attempted: the indexer kept failing',
                  }),
                );
              break;
            }
          }
        }

        ctx.logger.debug('Saved objects provisioning finished');

        if (failures.length > 0) {
          return ctx.taskResult.warning(
            `Could not provision ${failures.length} of ${dashboardsWithVisualizations.length} dashboard definition files. First error [${failures[0].file}]: ${failures[0].error}`,
            { failures },
          );
        }

        return ctx.taskResult.ok();
      } catch (error) {
        const message = `Error provisioning saved objects: ${getErrorMessage(
          error,
        )}`;
        ctx.logger.error(message);
        throw new Error(message);
      }
    },
  });
