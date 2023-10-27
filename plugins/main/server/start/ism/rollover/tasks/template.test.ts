import taskTemplate from './template';

jest.mock('fs', () => ({
  readFileSync: () => '{}', // Mock JSON
}));

describe('Task:Roll over Index State Management:check roll over alias templates', () => {
  it.each`
    setTemplates                                                                                               | initialTemplates                           | finalTemplates
    ${[{ name: 'custom-template', path: 'path/to/file' }, { name: 'custom-template2', path: 'path/to/file' }]} | ${[]}                                      | ${['custom-template', 'custom-template2']}
    ${[{ name: 'custom-template', path: 'path/to/file' }, { name: 'custom-template2', path: 'path/to/file' }]} | ${['custom-template']}                     | ${['custom-template', 'custom-template2']}
    ${[{ name: 'custom-template', path: 'path/to/file' }, { name: 'custom-template2', path: 'path/to/file' }]} | ${['custom-template', 'custom-template2']} | ${['custom-template', 'custom-template2']}
  `(
    'Check if template exists and creates if does not exist',
    async ({ setTemplates, initialTemplates, finalTemplates }) => {
      const currentTemplates = [...initialTemplates];

      // Mock context
      const context = {
        wazuh: {
          logger: {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        core: {
          opensearch: {
            client: {
              asInternalUser: {
                indices: {
                  getTemplate: jest.fn().mockImplementation(({ name }) => {
                    return currentTemplates.includes(name)
                      ? Promise.resolve()
                      : Promise.reject({ statusCode: 404 });
                  }),
                  putTemplate: jest
                    .fn()
                    .mockImplementation(async ({ name }) => {
                      currentTemplates.push(name);
                    }),
                },
              },
            },
          },
        },
        job: {
          templates: setTemplates,
        },
      };

      await taskTemplate(context, { opensearchClient: {}, config: {} });

      setTemplates.forEach(({ name }) => {
        expect(
          context.core.opensearch.client.asInternalUser.indices.getTemplate,
        ).toHaveBeenCalled();
        if (initialTemplates.includes(name)) {
          expect(context.wazuh.logger.debug).toHaveBeenCalledWith(
            `Template [${name}] already exists`,
          );
        } else {
          expect(context.wazuh.logger.debug).toHaveBeenCalledWith(
            `Template [${name}] not found`,
          );
          expect(
            context.core.opensearch.client.asInternalUser.indices.putTemplate,
          ).toHaveBeenCalled();
          expect(context.wazuh.logger.info).toHaveBeenCalledWith(
            `Template [${name}] was updated`,
          );
        }
      });

      // Ensure the current templates is equal to the final templates
      expect(finalTemplates).toEqual(currentTemplates);
    },
  );
});
