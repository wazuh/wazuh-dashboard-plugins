import { getSortForColumn } from './search-bar-service';

describe('getSortForColumn', () => {
  it('sorts the time field as date_nanos', () => {
    // eslint-disable-next-line camelcase
    const expected = { order: 'asc', numeric_type: 'date_nanos' };
    expect(
      getSortForColumn({ id: '@timestamp', direction: 'asc' }, '@timestamp'),
    ).toEqual({ '@timestamp': expected });
  });

  it('keeps a plain direction for other fields', () => {
    expect(
      getSortForColumn({ id: 'agent.name', direction: 'asc' }, '@timestamp'),
    ).toEqual({ 'agent.name': 'asc' });
  });

  it('keeps a plain direction when the index pattern has no time field', () => {
    expect(getSortForColumn({ id: '@timestamp' }, undefined)).toEqual({
      '@timestamp': 'desc',
    });
  });
});
