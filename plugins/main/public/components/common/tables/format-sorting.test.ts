import { formatSorting } from './format-sorting';

describe('formatSorting', () => {
  it('formats an ascending sort as +field', () => {
    expect(formatSorting({ field: 'name', direction: 'asc' })).toBe('+name');
  });

  it('formats a descending sort as -field', () => {
    expect(formatSorting({ field: 'name', direction: 'desc' })).toBe('-name');
  });

  it('supports nested fields', () => {
    expect(formatSorting({ field: 'policy.effect', direction: 'asc' })).toBe(
      '+policy.effect',
    );
  });

  it.each([
    ['the field is missing', { direction: 'asc' }],
    ['the direction is missing', { field: 'name' }],
    ['no sorting is provided', undefined],
  ])('returns an empty string when %s', (_case, sorting) => {
    expect(formatSorting(sorting)).toBe('');
  });
});
