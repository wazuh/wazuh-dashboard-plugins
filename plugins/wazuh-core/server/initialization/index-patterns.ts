import { IndexPatternsFetcher } from '../../../../src/plugins/data/server';
import {
  InitializationTaskContext,
  InitializationTaskRunContext,
} from '../services';

interface EnsureIndexPatternExistenceContextTask {
  indexPatternID: string;
  options: any;
}

interface EnsureIndexPatternExistenceContextTaskWithConfigurationSetting
  extends EnsureIndexPatternExistenceContextTask {
  configurationSettingKey: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decoratorCheckIsEnabled =
  callback =>
  async (
    ctx: InitializationTaskRunContext,
    {
      configurationSettingKey,
      ...ctxTask
    }: EnsureIndexPatternExistenceContextTaskWithConfigurationSetting,
  ) => {
    if (await ctx.configuration.get(configurationSettingKey)) {
      await callback(ctx, ctxTask);
    } else {
      ctx.logger.info(`Check [${configurationSettingKey}]: disabled. Skipped.`);
    }
  };

async function getFieldMappings(
  { logger, indexPatternsClient },
  indexPatternTitle: string,
) {
  logger.debug(`Getting index pattern fields for title [${indexPatternTitle}]`);

  // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/2.16.0/src/plugins/data/server/index_patterns/routes.ts#L74
  const fields = await indexPatternsClient.getFieldsForWildcard({
    pattern: indexPatternTitle,
    // meta_fields=_source&meta_fields=_id&meta_fields=_type&meta_fields=_index&meta_fields=_score
    metaFields: ['_source', '_id', '_type', '_index', '_score'],
  });

  logger.debug(
    `Fields for index pattern with title [${indexPatternTitle}]: ${JSON.stringify(
      fields,
    )}`,
  );

  return fields;
}

async function createIndexPattern(
  { logger, savedObjectsClient, indexPatternsClient },
  indexPatternID,
  options: {
    fieldsNoIndices?: any;
    savedObjectOverwrite?: Record<string, any>;
  } = {},
) {
  try {
    let fields;

    try {
      fields = await getFieldMappings(
        { logger, indexPatternsClient },
        indexPatternID,
      );
    } catch (error) {
      if (error?.output?.statusCode === 404 && options.fieldsNoIndices) {
        const message = `Fields for index pattern with ID [${indexPatternID}] could not be obtained. This could indicate there are not matching indices because they were not generated or there is some error in the process that generates and indexes that data. The index pattern will be created with a set of pre-defined fields.`;

        logger.warn(message);
        fields = options.fieldsNoIndices;
      } else {
        throw error;
      }
    }

    const savedObjectData = {
      title: indexPatternID,
      fields: JSON.stringify(fields),
      ...options?.savedObjectOverwrite,
    };

    logger.debug(
      `Creating index pattern with ID [${indexPatternID}] title [${savedObjectData.title}]`,
    );

    const response = await savedObjectsClient.create(
      'index-pattern',
      savedObjectData,
      {
        id: indexPatternID,
        overwrite: true,
        refresh: true,
      },
    );
    const indexPatternCreatedMessage = `Created index pattern with ID [${response.id}] title [${response.attributes.title}]`;

    logger.info(indexPatternCreatedMessage);

    return response;
  } catch (error) {
    throw new Error(
      `index pattern with ID [${indexPatternID}] could not be created due to: ${error.message}`,
    );
  }
}

export const ensureIndexPatternExistence = async (
  { logger, savedObjectsClient, indexPatternsClient },
  { indexPatternID, options = {} }: EnsureIndexPatternExistenceContextTask,
) => {
  try {
    logger.debug(
      `Checking existence of index pattern with ID [${indexPatternID}]`,
    );

    const response = await savedObjectsClient.get(
      'index-pattern',
      indexPatternID,
    );

    logger.debug(`Index pattern with ID [${indexPatternID}] exists`);

    return response;
  } catch (error) {
    // Get not found saved object
    if (error?.output?.statusCode === 404) {
      // Create index pattern
      logger.info(`Index pattern with ID [${indexPatternID}] does not exist`);

      return await createIndexPattern(
        { logger, savedObjectsClient, indexPatternsClient },
        indexPatternID,
        options,
      );
    } else {
      throw new Error(
        `index pattern with ID [${indexPatternID}] existence could not be checked due to: ${error.message}`,
      );
    }
  }
};

function getSavedObjectsClient(
  ctx: InitializationTaskRunContext,
  scope: InitializationTaskContext,
) {
  switch (scope) {
    case 'internal': {
      return ctx.core.savedObjects.createInternalRepository();
    }

    case 'user': {
      return ctx.core.savedObjects.savedObjectsStart.getScopedClient(
        ctx.request,
      );
    }

    default: {
      break;
    }
  }
}

function getIndexPatternsClient(
  ctx: InitializationTaskRunContext,
  scope: InitializationTaskContext,
) {
  switch (scope) {
    case 'internal': {
      return new IndexPatternsFetcher(
        ctx.core.opensearch.legacy.client.callAsInternalUser,
      );
    }

    case 'user': {
      return new IndexPatternsFetcher(
        ctx.core.opensearch.legacy.client.callAsCurrentUser,
      );
    }

    default: {
      break;
    }
  }
}

function getIndexPatternID(
  ctx: InitializationTaskRunContext,
  scope: string,
  rest: any,
) {
  switch (scope) {
    case 'internal': {
      return rest.getIndexPatternID(ctx);
    }

    case 'user': {
      return ctx.getIndexPatternID(ctx);
    }

    default: {
      break;
    }
  }
}

export const initializationTaskCreatorIndexPattern = ({
  taskName,
  options = {},
  configurationSettingKey,
  ...rest
}: {
  getIndexPatternID: (ctx: any) => Promise<string>;
  taskName: string;
  options: object;
  configurationSettingKey: string;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    let indexPatternID;

    try {
      ctx.logger.debug('Starting index pattern saved object');
      indexPatternID = await getIndexPatternID(ctx, ctx.scope, rest);

      // Get clients depending on the scope
      const savedObjectsClient = getSavedObjectsClient(ctx, ctx.scope);
      const indexPatternsClient = getIndexPatternsClient(ctx, ctx.scope);

      return await ensureIndexPatternExistence(
        { ...ctx, indexPatternsClient, savedObjectsClient },
        {
          indexPatternID,
          options,
          configurationSettingKey,
        },
      );
    } catch (error) {
      const message = `Error initilizating index pattern with ID [${indexPatternID}]: ${error.message}`;

      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});
