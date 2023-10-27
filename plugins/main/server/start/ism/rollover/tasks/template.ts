import fs from 'fs';

async function checkTemplate(
  context: any,
  { name, path }: { name: string; path: string },
) {
  try {
    // Check if the template already exists
    try {
      context.wazuh.logger.debug(`Checking the template [${name}]`);
      await context.core.opensearch.client.asInternalUser.indices.getTemplate({
        name: name,
      });
      context.wazuh.logger.debug(`Template [${name}] already exists`);
      return;
    } catch (error) {
      // Template not found
      if (error.statusCode === 404) {
        context.wazuh.logger.debug(`Template [${name}] not found`);
        // return;

        context.wazuh.logger.debug(`Creating template [${name}]`);

        context.wazuh.logger.debug(`Reading [${path}]`);

        // Get file content
        const template = JSON.parse(
          fs.readFileSync(path, {
            encoding: 'utf-8',
          }),
        );

        context.wazuh.logger.debug(
          `Template [${name}] from file [${path}]: ${JSON.stringify(template)}`,
        );

        // Create the template
        await context.core.opensearch.client.asInternalUser.indices.putTemplate(
          {
            name: name,
            body: template,
          },
        );

        context.wazuh.logger.info(`Template [${name}] was updated`);
      }
    }
  } catch (error) {
    context.wazuh.logger.error(error.message);
  }
}

export default async function (context, { opensearchClient, config }) {
  // Check rollover alias templates
  context.wazuh.logger.debug(
    'Checking the roll over alias templates are indexed',
  );
  await Promise.all(
    context.job.templates.map(({ name, path }) =>
      checkTemplate(context, { name, path }),
    ),
  );
  context.wazuh.logger.debug('Check the roll over alias templates finished');
}
