import { ensureIndexPatternHasTemplate } from './index-patterns';

const mockContext = () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
  services: {
    core: {
      opensearch: {
        client: {
          asInternalUser: {
            cat: {
              templates: () => {
                return {
                  body: [
                    {
                      name: 'wazuh',
                      index_patterns:
                        '[wazuh-alerts-4.x-*, wazuh-archives-4.x-*]',
                      order: '0',
                      version: '1',
                      composed_of: '',
                    },
                    {
                      name: 'wazuh-agent',
                      index_patterns: '[wazuh-monitoring-*]',
                      order: '0',
                      version: null,
                      composed_of: '',
                    },
                    {
                      name: 'wazuh-statistics',
                      index_patterns: '[wazuh-statistics-*]',
                      order: '0',
                      version: null,
                      composed_of: '',
                    },
                  ],
                };
              },
            },
          },
        },
      },
    },
  },
});

describe('getTemplateForIndexPattern', () => {
  it.each`
    indexPatternTitle          | templateFound | templatesNameFound
    ${'custom-alerts-*'}       | ${false}      | ${'Template was not found for [custom-alerts-*]'}
    ${'custom-wazuh-alerts-*'} | ${false}      | ${'Template was not found for [custom-wazuh-alerts-*]'}
    ${'wazuh-alerts-4.x-t*'}   | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-4.x-*'}    | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-4.x*'}     | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-4.*'}      | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-4*'}       | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-*'}        | ${true}       | ${['wazuh']}
    ${'wazuh-alerts-'}         | ${true}       | ${['wazuh']}
    ${'wazuh-alerts'}          | ${true}       | ${['wazuh']}
    ${'wazuh-al'}              | ${true}       | ${['wazuh']}
    ${'wazuh-a'}               | ${true}       | ${['wazuh']}
  `(
    `indexPatternTitle: $indexPatternTitle`,
    async ({ indexPatternTitle, templateFound, templatesNameFound }) => {
      if (!templateFound) {
        expect(() =>
          ensureIndexPatternHasTemplate(mockContext(), indexPatternTitle),
        ).rejects.toThrow(templatesNameFound);
      } else {
        expect(
          (
            await ensureIndexPatternHasTemplate(
              mockContext(),
              indexPatternTitle,
            )
          ).map(({ name }) => name),
        ).toEqual(templatesNameFound);
      }
    },
  );
});
