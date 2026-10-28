import { getSortForColumn, search } from './search-bar-service';
import { getPlugins } from '../../../kibana-services';
import type { IndexPattern } from '../../../../../../src/plugins/data/public';

jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getPlugins: jest.fn(),
}));

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

describe('search', () => {
  it('sends the time field sort as date_nanos', async () => {
    const searchSource = {
      setParent: jest.fn().mockReturnThis(),
      setField: jest.fn().mockReturnThis(),
      fetch: jest.fn().mockResolvedValue({}),
    };
    (getPlugins as jest.Mock).mockReturnValue({
      data: {
        search: {
          searchSource: { create: jest.fn().mockResolvedValue(searchSource) },
        },
      },
    });

    await search({
      indexPattern: { timeFieldName: '@timestamp' } as IndexPattern,
      sorting: {
        columns: [
          { id: '@timestamp', direction: 'desc' },
          { id: 'agent.name', direction: 'asc' },
        ],
      },
    });

    // eslint-disable-next-line camelcase
    const timeSort = { order: 'desc', numeric_type: 'date_nanos' };
    expect(searchSource.setField).toHaveBeenCalledWith('sort', [
      { '@timestamp': timeSort },
      { 'agent.name': 'asc' },
    ]);
  });
});
