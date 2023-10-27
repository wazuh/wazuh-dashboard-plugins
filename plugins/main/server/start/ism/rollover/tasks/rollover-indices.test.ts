import taskRolloverIndices from './rollover-indices';

jest.mock('fs', () => ({
  readFileSync: () => '{}', // Mock JSON
}));

describe('Task:Roll over Index State Management:check roll over create indices', () => {
  it.each`
    setIndices                                                                                           | initialIndices                       | finalIndices
    ${[{ name: 'custom-index', path: 'path/to/file' }, { name: 'custom-index2', path: 'path/to/file' }]} | ${[]}                                | ${['custom-index', 'custom-index2']}
    ${[{ name: 'custom-index', path: 'path/to/file' }, { name: 'custom-index2', path: 'path/to/file' }]} | ${['custom-index']}                  | ${['custom-index', 'custom-index2']}
    ${[{ name: 'custom-index', path: 'path/to/file' }, { name: 'custom-index2', path: 'path/to/file' }]} | ${['custom-index', 'custom-index2']} | ${['custom-index', 'custom-index2']}
  `(
    'Check if the index exists and create it if does not exist',
    async ({ setIndices, initialIndices, finalIndices }) => {
      const currentIndices = [...initialIndices];

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
                  exists: jest.fn().mockImplementation(({ index }) => {
                    return { body: currentIndices.includes(index) };
                  }),
                  create: jest.fn().mockImplementation(async ({ index }) => {
                    currentIndices.push(index);
                    return {
                      body: {
                        index,
                      },
                    };
                  }),
                },
              },
            },
          },
        },
        job: {
          indices: setIndices,
        },
      };

      await taskRolloverIndices(context, {
        opensearchClient: {},
        config: {},
      });

      setIndices.forEach(({ name }) => {
        expect(
          context.core.opensearch.client.asInternalUser.indices.exists,
        ).toHaveBeenCalled();
        if (initialIndices.includes(name)) {
          expect(context.wazuh.logger.debug).toHaveBeenCalledWith(
            `Index [${name}] already exists`,
          );
        } else {
          expect(context.wazuh.logger.debug).toHaveBeenCalledWith(
            `Index [${name}] does not exist`,
          );
          expect(
            context.core.opensearch.client.asInternalUser.indices.create,
          ).toHaveBeenCalled();
          expect(context.wazuh.logger.info).toHaveBeenCalledWith(
            `Created index [${name}]`,
          );
        }
      });

      // Ensure the current indices is equal to the final indices
      expect(finalIndices).toEqual(currentIndices);
    },
  );
});
