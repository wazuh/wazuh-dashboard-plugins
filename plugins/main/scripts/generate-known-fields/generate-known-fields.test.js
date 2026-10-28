const { extractFields, mapIndexFieldType } = require('./generate-known-fields');

describe('mapIndexFieldType', () => {
  it.each([
    ['date', 'date'],
    ['date_nanos', 'date'],
    ['keyword', 'string'],
    ['unknown_type', 'string'],
  ])('maps %s to %s', (esType, expected) => {
    expect(mapIndexFieldType(esType, {})).toBe(expected);
  });
});

describe('extractFields', () => {
  it('keeps the date_nanos ES type on a date field', () => {
    const fields = extractFields({ '@timestamp': { type: 'date_nanos' } }, '');
    expect(fields.find(({ name }) => name === '@timestamp')).toEqual({
      name: '@timestamp',
      type: 'date',
      esTypes: ['date_nanos'],
      searchable: true,
      aggregatable: true,
      readFromDocValues: true,
    });
  });
});
