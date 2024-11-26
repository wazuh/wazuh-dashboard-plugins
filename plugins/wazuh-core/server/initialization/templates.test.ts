import { getTemplateForIndexPattern } from './templates';

const templates = [
  {
    name: 'wazuh',
    index_patterns: '[wazuh-alerts-4.x-*, wazuh-archives-4.x-*]',
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
];

describe('getTemplateForIndexPattern', () => {
  it.each`
    indexPatternTitle    | templateNameFound
    ${'custom-alerts-*'} | ${[]}
    ${'wazuh-alerts-*'}  | ${['wazuh']}
    ${'wazuh-alerts-'}   | ${['wazuh']}
  `(
    `indexPatternTitle: $indexPatternTitle`,
    ({ indexPatternTitle, templateNameFound }) => {
      expect(
        getTemplateForIndexPattern(indexPatternTitle, templates).map(
          ({ name }) => name,
        ),
      ).toEqual(templateNameFound);
    },
  );
});
