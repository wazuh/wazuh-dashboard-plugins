import {
  getInventoryExportFileName,
  getInventoryReportFields,
} from './inventory-report';
import { IndexPattern } from '../../../../../../src/plugins/data/common';

const indexPatternWith = (fields: string[]) =>
  ({
    fields: { getByName: (name: string) => fields.includes(name) || undefined },
  } as unknown as Pick<IndexPattern, 'fields'>);

describe('getInventoryReportFields', () => {
  it('puts the endpoint name first and the state date last', () => {
    expect(
      getInventoryReportFields(
        ['package.name', 'package.version'],
        indexPatternWith([
          'wazuh.agent.name',
          'package.name',
          'package.version',
          'state.modified_at',
        ]),
      ),
    ).toEqual([
      'wazuh.agent.name',
      'package.name',
      'package.version',
      'state.modified_at',
    ]);
  });

  it('does not repeat the endpoint name or date when they are visible', () => {
    expect(
      getInventoryReportFields(
        ['state.modified_at', 'package.name', 'wazuh.agent.name'],
        indexPatternWith([
          'wazuh.agent.name',
          'package.name',
          'state.modified_at',
        ]),
      ),
    ).toEqual(['wazuh.agent.name', 'package.name', 'state.modified_at']);
  });

  it('leaves out fields the index pattern does not have', () => {
    expect(
      getInventoryReportFields(
        ['policy.name'],
        indexPatternWith(['policy.name']),
      ),
    ).toEqual(['policy.name']);
  });
});

describe('getInventoryExportFileName', () => {
  it.each([
    ['it-hygiene-inventory-packages', 'packages'],
    ['it-hygiene-inventory-browser-extensions', 'browser-extensions'],
    ['fim-files-inventory', 'fim-files'],
    ['sca-policies-inventory', 'sca-policies'],
    ['case-management-cases', 'case-management-cases'],
  ])('names the export of %s after %s', (tableId, fileName) => {
    expect(getInventoryExportFileName(tableId)).toBe(fileName);
  });
});
