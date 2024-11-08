export const checkIndexPatternHasTemplate = async (
  { logger },
  { indexPatternTitle, opensearchClient },
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
  if (!templatesFound.length) {
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

export function getTemplateForIndexPattern(
  indexPatternTitle: string,
  templates: { name: string; index_patterns: string }[],
) {
  return templates.filter(({ index_patterns }: { index_patterns: string }) => {
    const [, cleanIndexPatterns] = index_patterns.match(/\[(.+)\]/) || [
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

    const lastChar = indexPatternTitle[indexPatternTitle.length - 1];
    const indexPatternTitleCleaned =
      lastChar === '*' ? indexPatternTitle.slice(0, -1) : indexPatternTitle;
    return indexPatterns.some(indexPattern => {
      const lastChar = indexPattern[indexPattern.length - 1];
      const indexPatternCleaned =
        lastChar === '*' ? indexPattern.slice(0, -1) : indexPattern;
      return (
        indexPatternCleaned.includes(indexPatternTitleCleaned) ||
        indexPatternTitleCleaned.includes(indexPatternCleaned)
      );
    });
  });
}

export const initializationTaskCreatorExistTemplate = ({
  getOpenSearchClient,
  getIndexPatternTitle,
  taskName,
}: {
  getOpenSearchClient: (ctx: any) => any;
  getIndexPatternTitle: (ctx: any) => Promise<string>;
  taskName: string;
}) => ({
  name: taskName,
  async run(ctx) {
    try {
      ctx.logger.debug('Starting check of existent template');

      const opensearchClient = getOpenSearchClient(ctx);
      const indexPatternTitle = await getIndexPatternTitle(ctx);
      await checkIndexPatternHasTemplate(ctx, {
        opensearchClient,
        indexPatternTitle,
      });
      ctx.logger.info('Start check of existent template finished');
    } catch (e) {
      ctx.logger.error(`Error checking of existent template: ${e.message}`);
    }
  },
});
