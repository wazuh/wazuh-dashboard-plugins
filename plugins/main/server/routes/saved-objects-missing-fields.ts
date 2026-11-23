import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';
import {
  SAVED_OBJECTS_MISSING_FIELDS_MAX_IDS,
  SAVED_OBJECTS_MISSING_FIELDS_ROUTE,
} from '../../common/saved-objects-missing-fields';
import {
  getScannedObjects,
  scanMissingFields,
} from '../health-check/saved-objects-missing-fields/scan-missing-fields';

export function SavedObjectsMissingFieldsRoutes(router: IRouter) {
  router.post(
    {
      path: SAVED_OBJECTS_MISSING_FIELDS_ROUTE,
      validate: {
        body: schema.object({
          ids: schema.arrayOf(schema.string({ minLength: 1 }), {
            minSize: 1,
            maxSize: SAVED_OBJECTS_MISSING_FIELDS_MAX_IDS,
          }),
        }),
      },
    },
    async (context, request, response) => {
      const { client } = context.core.savedObjects;
      try {
        const reports = await scanMissingFields(
          await getScannedObjects(client, request.body.ids),
          client,
        );

        return response.ok({ body: { reports } });
      } catch (error) {
        const message = `Error checking the fields used by saved objects: ${
          error instanceof Error ? error.message : String(error)
        }`;
        context.wazuh.logger.error(message);

        return response.customError({
          statusCode: (error as { statusCode?: number })?.statusCode ?? 500,
          body: { message },
        });
      }
    },
  );
}
