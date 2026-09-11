import { itemMatchesQuery, readItemField } from './configuration-list-utils';

describe('readItemField', () => {
  it('returns the item itself for the bare-scalar-list convention', () => {
    expect(readItemField('/etc/passwd', '')).toBe('/etc/passwd');
  });

  it('reads a nested path off an object item', () => {
    expect(readItemField({ entry: 'HKEY_LOCAL_MACHINE' }, 'entry')).toBe(
      'HKEY_LOCAL_MACHINE',
    );
  });
});

describe('itemMatchesQuery', () => {
  const list = {
    itemLabel: (item: { dir: string }) => item.dir,
    itemFields: [
      { field: 'dir', label: 'Selected item' },
      {
        field: 'opts',
        label: 'Perform all checksums',
        render: (opts: string[]) =>
          Array.isArray(opts) && opts.includes('check_all') ? 'yes' : 'no',
      },
    ],
  };
  const item = { dir: '/etc', opts: ['check_all'] };

  it('always matches when there is no query', () => {
    expect(itemMatchesQuery(list, item, 0, '')).toBe(true);
  });

  it('matches on a plain field raw value', () => {
    expect(itemMatchesQuery(list, item, 0, '/etc')).toBe(true);
  });

  it('matches on a field render function effective value, not just its raw value', () => {
    expect(itemMatchesQuery(list, item, 0, 'yes')).toBe(true);
  });

  it('matches on a field label', () => {
    expect(itemMatchesQuery(list, item, 0, 'perform all checksums')).toBe(true);
  });

  it('does not match when the query is nowhere in the item', () => {
    expect(itemMatchesQuery(list, item, 0, 'nowhere-to-be-found')).toBe(false);
  });
});
