import { getExportFields } from './get-export-fields';

describe('getExportFields', () => {
  it('returns the fields of the columns in display order', () => {
    expect(
      getExportFields([{ field: 'name' }, { field: 'id' }, { field: 'ip' }]),
    ).toEqual(['name', 'id', 'ip']);
  });

  it('expands a composed column into its fields', () => {
    expect(
      getExportFields([
        { field: 'id' },
        {
          field: 'os.name,os.version',
          composeField: ['os.name', 'os.version'],
        },
        { field: 'version' },
      ]),
    ).toEqual(['id', 'os.name', 'os.version', 'version']);
  });

  it('leaves out the action columns and the columns without a field', () => {
    expect(
      getExportFields([
        { field: 'id' },
        {},
        { field: 'actions', actions: [{ name: 'Edit' }] },
      ]),
    ).toEqual(['id']);
  });

  it('does not repeat a field', () => {
    expect(
      getExportFields([
        { field: 'os.name' },
        {
          field: 'os.name,os.version',
          composeField: ['os.name', 'os.version'],
        },
      ]),
    ).toEqual(['os.name', 'os.version']);
  });
});
