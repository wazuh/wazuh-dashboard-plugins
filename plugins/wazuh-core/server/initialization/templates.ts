import { InitializationTaskRunContext } from '../services';

export function getTemplateForIndexPattern(
  indexPatternTitle: string,
  templates: { name: string; index_patterns: string }[],
) {
  return templates.filter(
    ({ index_patterns: indexPatternsTemplate }: { index_patterns: string }) => {
      const [, cleanIndexPatterns] = indexPatternsTemplate.match(/\[(.+)]/) || [
        null,
        null,
      ];

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
          indexPatternCleaned.includes(indexPatternTitleCleaned) ||
          indexPatternTitleCleaned.includes(indexPatternCleaned)
        );
      });
    },
  );
}

export const checkIndexPatternHasTemplate = async (
  { logger }: InitializationTaskRunContext,
  {
    indexPatternTitle,
    opensearchClient,
  }: { indexPatternTitle: string; opensearchClient: any },
) => {
  logger.debug('Getting templates');

  const data = await opensearchClient.cat.templates({ format: 'json' });

  logger.debug(
    'Checking the index pattern with title [${indexPatternTitle}] has defined some template',
  );

  const templatesFound = getTemplateForIndexPattern(
    indexPatternTitle,
    data.body,
  );

  if (templatesFound.length === 0) {
    throw new Error(
      `No template found for index pattern with title [${indexPatternTitle}]`,
    );
  }

  logger.info(
    `Template [${templatesFound
      .map(({ name }) => name)
      .join(
        ', ',
      )}] found for index pattern with title [${indexPatternTitle}]: `,
  );
};

export const initializationTaskCreatorExistTemplate = ({
  getOpenSearchClient,
  getIndexPatternTitle,
  taskName,
}: {
  getOpenSearchClient: (ctx: InitializationTaskRunContext) => any;
  getIndexPatternTitle: (ctx: InitializationTaskRunContext) => Promise<string>;
  taskName: string;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    let indexPatternTitle;

    try {
      ctx.logger.debug('Starting check of existent template');

      const opensearchClient = getOpenSearchClient(ctx);

      indexPatternTitle = await getIndexPatternTitle(ctx);
      await checkIndexPatternHasTemplate(ctx, {
        opensearchClient,
        indexPatternTitle,
      });
      ctx.logger.info('Start check of existent template finished');
    } catch (error) {
      const message = `Error checking of existent template for index pattern with title [${indexPatternTitle}]: ${error.message}`;

      ctx.logger.error(message);
      throw new Error(message);
    }
  },
});
