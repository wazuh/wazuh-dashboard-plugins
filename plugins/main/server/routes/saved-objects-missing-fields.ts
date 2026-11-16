import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';
import { SAVED_OBJECTS_MISSING_FIELDS_ROUTE } from '../../common/saved-objects-missing-fields';
import {
  getScannedObjects,
  scanMissingFields,
} from '../health-check/saved-objects-missing-fields/scan-missing-fields';

// A dashboard rarely holds more panels than this.
const MAX_IDS = 500;

export function SavedObjectsMissingFieldsRoutes(router: IRouter) {
  router.post(
    {
      path: SAVED_OBJECTS_MISSING_FIELDS_ROUTE,
      validate: {
        body: schema.object({
          ids: schema.arrayOf(schema.string({ minLength: 1 }), {
            minSize: 1,
            maxSize: MAX_IDS,
          }),
        }),
      },
    },
    async (context, request, response) => {
      const { client } = context.core.savedObjects;
      const reports = await scanMissingFields(
        await getScannedObjects(client, request.body.ids),
        client,
      );

      return response.ok({ body: { reports } });
    },
  );
}
