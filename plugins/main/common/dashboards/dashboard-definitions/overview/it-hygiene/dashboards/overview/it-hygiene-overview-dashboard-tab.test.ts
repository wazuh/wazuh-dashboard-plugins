import fs from 'fs';
import path from 'path';

const savedObjects = fs
  .readFileSync(
    path.join(__dirname, 'it-hygiene-overview-dashboard-tab.ndjson'),
    'utf8',
  )
  .split(/\r?\n/)
  .filter(line => line.trim())
  .map(line => JSON.parse(line));

const getSearchSource = (id: string) =>
  JSON.parse(
    savedObjects.find(savedObject => savedObject.id === id).attributes
      .kibanaSavedObjectMeta.searchSourceJSON,
  );

describe('IT Hygiene overview dashboard package panels', () => {
  // The panels read every inventory index, so browser extensions must be
  // filtered out to count only the installed packages.
  it.each([
    'it-hygiene-system-package.type',
    'it-hygiene-top-packages-package.name',
  ])('visualization %s only counts the packages index', id => {
    expect(getSearchSource(id).filter).toEqual([
      expect.objectContaining({
        wildcard: { _index: 'wazuh-states-inventory-packages*' },
        meta: expect.objectContaining({ negate: false, disabled: false }),
      }),
    ]);
  });
});
