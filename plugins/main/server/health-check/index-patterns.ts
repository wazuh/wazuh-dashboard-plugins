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

// TODO: unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decoratorCheckIsEnabled =
  (
    callback: (
      ctx: InitializationTaskRunContext,
      ctxTask: EnsureIndexPatternExistenceContextTask,
    ) => Promise<void>,
  ) =>
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
    let fieldsObj;

    try {
      fieldsObj = await getFieldMappings(
        { logger, indexPatternsClient },
        indexPatternID,
      );
    } catch (error) {
      if (error?.output?.statusCode === 404 && options.fieldsNoIndices) {
        const message = `Fields for index pattern with ID [${indexPatternID}] could not be obtained. This could indicate there are not matching indices because they were not generated or there is some error in the process that generates and indexes that data. The index pattern will be created with a set of pre-defined fields.`;

        logger.warn(message);
        fieldsObj = options.fieldsNoIndices;
      } else {
        throw error;
      }
    }

    const title = indexPatternID;
    const fields = JSON.stringify(fieldsObj);

    let savedObjectData = {
      title,
      fields,
    };

    if (typeof options?.savedObjectOverwrite === 'function') {
      const overwriteProps = options?.savedObjectOverwrite(savedObjectData);
      savedObjectData = {
        ...savedObjectData,
        ...overwriteProps,
      };
    }

    if (typeof options?.savedObjectOverwrite === 'object') {
      savedObjectData = {
        ...savedObjectData,
        ...options?.savedObjectOverwrite,
      };
    }

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
      `index pattern with ID [${indexPatternID}] could not be created due to: ${error.message}. This could indicate the collection is disabled or there is a problem in the collection and ingestion.`,
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

export const matchesPatternList = (listString, indexPatternTitle) => {
  const [, cleanIndexPatterns] = listString.match(/\[(.+)]/) || [null, null];

  if (!cleanIndexPatterns) {
    return false;
  }

  const indexPatterns = cleanIndexPatterns.match(/([^\s,]+)/g);

  if (!indexPatterns) {
    return false;
  }

  const lastChar = indexPatternTitle.at(-1);
  const indexPatternTitleCleaned =
    lastChar === '*' ? indexPatternTitle.slice(0, -1) : indexPatternTitle;

  return indexPatterns.some(indexPattern => {
    const lastChar = indexPattern.at(-1);
    const indexPatternCleaned =
      lastChar === '*' ? indexPattern.slice(0, -1) : indexPattern;

    return (
      indexPatternCleaned.startsWith(indexPatternTitleCleaned) ||
      indexPatternTitleCleaned.startsWith(indexPatternCleaned)
    );
  });
};

export const ensureIndexPatternHasTemplate = async (
  ctx,
  indexPatternTitle: string,
) => {
  ctx.logger.debug('Getting templates');
  const data =
    await ctx.services.core.opensearch.client.asInternalUser.cat.templates({
      format: 'json',
    });

  const templates = data.body;

  ctx.logger.debug(`Templates: [${templates}]`);

  const templatesFound = templates.filter(template => {
    if (!template?.index_patterns) {
      return false;
    }

    return matchesPatternList(template?.index_patterns, indexPatternTitle);
  });

  if (templatesFound.length === 0) {
    throw new Error(`Template was not found for [${indexPatternTitle}]`);
  }

  ctx.logger.info(
    `Templates found [${templatesFound.map(({ name }) => name).join(', ')}]`,
  );

  return templatesFound;
};

function getSavedObjectsClient(
  ctx: InitializationTaskRunContext,
  scope: InitializationTaskContext,
) {
  switch (scope) {
    case 'internal': {
      return ctx.services.core.savedObjects.createInternalRepository();
    }

    case 'user': {
      return ctx.services.core.savedObjects.savedObjectsStart.getScopedClient(
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
        ctx.services.core.opensearch.legacy.client.callAsInternalUser,
      );
    }

    case 'user': {
      return new IndexPatternsFetcher(
        ctx.services.core.opensearch.legacy.client.callAsCurrentUser,
      );
    }

    default: {
      break;
    }
  }
}

async function getIndexPatternID(
  services: any,
  ctx: InitializationTaskRunContext,
  indexPatternID: string,
  configurationSettingKey: string,
) {
  if (indexPatternID) {
    return indexPatternID;
  }
  switch (ctx.scope) {
    case 'internal': {
      return await services.configuration.get(configurationSettingKey);
    }

    case 'user': {
      // TODO
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
  indexPatternID,
  services,
  taskMeta = {},
  ...rest
}: {
  taskName: string;
  options: object;
  configurationSettingKey: string;
  indexPatternID?: string;
}) => ({
  isCritical: taskMeta?.isCritical || false,
  name: taskName,
  async run({ context: ctx, logger }: InitializationTaskRunContext) {
    let indexPatternIDResolved;

    try {
      logger.debug('Starting index pattern saved object');
      indexPatternIDResolved = await getIndexPatternID(
        services,
        ctx,
        indexPatternID,
        configurationSettingKey,
      );

      // Get clients depending on the scope
      const savedObjectsClient = getSavedObjectsClient(ctx, ctx.scope);
      const indexPatternsClient = getIndexPatternsClient(ctx, ctx.scope);

      const indexPattern = await ensureIndexPatternExistence(
        { ...ctx, indexPatternsClient, savedObjectsClient, logger },
        {
          indexPatternID: indexPatternIDResolved,
          options,
          configurationSettingKey,
        },
      );

      if (options.hasTemplate) {
        await ensureIndexPatternHasTemplate(
          { ...ctx, logger },
          indexPattern?.attributes?.title,
        );
      }

      return indexPattern;
    } catch (error) {
      const message = `Error initilizating index pattern with ID [${indexPatternIDResolved}]: ${error.message}`;

      logger.error(message);
      throw new Error(message);
    }
  },
});

const fieldMappers = {
  bytes: ({ type }) => (type === 'number' ? { id: 'bytes' } : undefined),
  // integer, remove thousand and decimal separators through the params.pattern
  integer: ({ type }) =>
    type === 'number' ? { id: 'number', params: { pattern: '0' } } : undefined,
  percent: ({ type }) => {
    return type === 'number'
      ? { id: 'percent', params: { pattern: '0,0.[00]%' } }
      : undefined;
  },
};

export function mapFieldsFormat(expectedFields: {
  [key: keyof typeof fieldMappers]: (field: any) => any;
}) {
  return ({ fields }) => {
    const fieldsToMap = Object.keys(expectedFields);
    const mappedFields = fields
      ?.filter(({ name }) => fieldsToMap.includes(name))
      .map(field => {
        const { name } = field;
        const mapper = fieldMappers[expectedFields[name]] || undefined;

        if (!mapper) {
          return undefined;
        }
        const result = mapper(field);
        if (!result) {
          return undefined;
        }
        return [name, result];
      })
      .filter(Boolean);

    if (mappedFields.length) {
      return {
        fieldFormatMap: JSON.stringify(Object.fromEntries(mappedFields)),
      }; // Add format map for expected fields
    }
    return {};
  };
}
