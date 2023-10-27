import fs from 'fs';

async function createIndexIfNotExist(context, { name: indexName, path }) {
  try {
    // Check if the index exists
    context.wazuh.logger.debug(`Checking index [${indexName}] exists`);
    const exists =
      await context.core.opensearch.client.asInternalUser.indices.exists({
        index: indexName,
      });
    context.wazuh.logger.debug(
      `Checked index [${indexName}] exists response: [${JSON.stringify(
        exists,
      )}]`,
    );
    // If the index doesn't exist
    if (!exists.body) {
      context.wazuh.logger.debug(`Index [${indexName}] does not exist`);
      context.wazuh.logger.debug(`Creating index [${indexName}]`);

      // Read content from file
      const content = JSON.parse(
        fs.readFileSync(path, {
          encoding: 'utf-8',
        }),
      );

      // Create index with content
      const response =
        await context.core.opensearch.client.asInternalUser.indices.create({
          index: indexName,
          body: content,
        });

      context.wazuh.logger.info(`Created index [${response.body.index}]`);
      context.wazuh.logger.debug(
        `Created index [${response.body.index}] with options [${JSON.stringify(
          content,
        )}]`,
      );
    } else {
      context.wazuh.logger.debug(`Index [${indexName}] already exists`);
    }
  } catch (error) {
    context.wazuh.logger.error(
      `Error checking the existence of index [${indexName}]: ${
        error.message
      }: ${JSON.stringify(error)}`,
    );
  }
}

export default async function (context, { opensearchClient, config }) {
  try {
    await Promise.all(
      context.job.indices.map(index => createIndexIfNotExist(context, index)),
    );
  } catch (error) {
    context.wazuh.logger.error(error.message);
  }
}
