const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');
const {
  TEMPLATE_SOURCES,
  extractFields,
  mapIndexFieldType,
  processTemplate,
} = require('./generate-known-fields');

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

describe('processTemplate', () => {
  let destination;

  beforeEach(() => {
    destination = fs.mkdtempSync(path.join(os.tmpdir(), 'known-fields-'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(destination, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('generates the security audit logs known fields from the inline template without fetching', async () => {
    const httpsGetSpy = jest.spyOn(https, 'get');

    await processTemplate(
      { ...TEMPLATE_SOURCES['security-auditlogs'], name: 'security-auditlogs' },
      { destination },
    );

    expect(httpsGetSpy).not.toHaveBeenCalled();
    const fields = JSON.parse(
      fs.readFileSync(
        path.join(destination, 'security-auditlogs.json'),
        'utf8',
      ),
    );
    expect(fields.find(({ name }) => name === '@timestamp')).toMatchObject({
      type: 'date',
      esTypes: ['date'],
    });
    expect(fields.find(({ name }) => name === 'audit_category')).toMatchObject({
      type: 'string',
      esTypes: ['text'],
      aggregatable: false,
    });
    expect(
      fields.find(({ name }) => name === 'audit_category.keyword'),
    ).toMatchObject({
      type: 'string',
      esTypes: ['keyword'],
      aggregatable: true,
    });
  });
});
