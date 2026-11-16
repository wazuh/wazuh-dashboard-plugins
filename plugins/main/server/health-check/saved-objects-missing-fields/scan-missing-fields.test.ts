/* eslint-disable camelcase -- saved objects API responses */
import type { SavedObjectsClientContract } from 'opensearch_dashboards/server';
import {
  findScannedObjects,
  getScannedObjects,
  scanMissingFields,
} from './scan-missing-fields';
import type { SavedObjectLike } from './find-missing-fields';

const indexRef = (id: string) => ({
  attributes: {
    kibanaSavedObjectMeta: {
      searchSourceJSON: JSON.stringify({ indexRefName: 'ref' }),
    },
  },
  references: [{ name: 'ref', type: 'index-pattern', id }],
});

const terms = (field: string) =>
  JSON.stringify({ aggs: [{ type: 'terms', params: { field } }] });

const legacySearch: SavedObjectLike = {
  id: 'legacy-search',
  type: 'search',
  ...indexRef('findings'),
  attributes: {
    ...indexRef('findings').attributes,
    title: 'Legacy search',
    columns: ['rule.groups'],
  },
};

const indexPatterns: Record<string, object> = {
  findings: {
    title: 'wazuh-findings-v5*',
    fields: JSON.stringify([{ name: 'agent.name' }, { name: '@timestamp' }]),
  },
  unloaded: { title: 'new-*', fields: '[]' },
  malformed: { title: 'broken-*', fields: '[{' },
};

const createClient = (
  savedSearches: SavedObjectLike[] = [],
): jest.Mocked<SavedObjectsClientContract> =>
  ({
    get: jest.fn((_type: string, id: string) =>
      indexPatterns[id]
        ? Promise.resolve({
            id,
            type: 'index-pattern',
            attributes: indexPatterns[id],
          })
        : Promise.reject(
            Object.assign(new Error('Not found'), { statusCode: 404 }),
          ),
    ),
    bulkGet: jest.fn((objects: { id: string; type: string }[]) =>
      Promise.resolve({
        saved_objects: objects.map(
          ({ id, type }) =>
            savedSearches.find(so => so.id === id && so.type === type) ?? {
              id,
              type,
              error: { statusCode: 404 },
            },
        ),
      }),
    ),
    find: jest.fn(),
  } as unknown as jest.Mocked<SavedObjectsClientContract>);

describe('scanMissingFields', () => {
  it('reports the objects with missing fields, once per index pattern', async () => {
    const client = createClient();
    const objects: SavedObjectLike[] = [
      {
        id: 'ok',
        type: 'visualization',
        ...indexRef('findings'),
        attributes: {
          ...indexRef('findings').attributes,
          title: 'Ok',
          visState: terms('agent.name'),
        },
      },
      {
        id: 'legacy',
        type: 'visualization',
        ...indexRef('findings'),
        attributes: {
          ...indexRef('findings').attributes,
          title: 'Legacy',
          visState: terms('rule.level'),
        },
      },
    ];

    expect(await scanMissingFields(objects, client)).toEqual([
      {
        id: 'legacy',
        type: 'visualization',
        title: 'Legacy',
        indexPatternId: 'findings',
        indexPatternTitle: 'wazuh-findings-v5*',
        missing: [{ field: 'rule.level', usedIn: ['aggregation'] }],
      },
    ]);
    expect(client.get).toHaveBeenCalledTimes(1);
  });

  it('checks a visualization built on a saved search against the index pattern of the search', async () => {
    const client = createClient([legacySearch]);
    const fromSearch: SavedObjectLike = {
      id: 'from-search',
      type: 'visualization',
      attributes: {
        title: 'From search',
        savedSearchRefName: 'search_0',
        visState: terms('location'),
      },
      references: [{ name: 'search_0', type: 'search', id: 'legacy-search' }],
    };

    const reports = await scanMissingFields([fromSearch], client);

    expect(reports).toEqual([
      expect.objectContaining({
        id: 'from-search',
        indexPatternId: 'findings',
        missing: [{ field: 'location', usedIn: ['aggregation'] }],
      }),
    ]);
  });

  it('skips objects whose index pattern is missing, or has no readable stored fields', async () => {
    const client = createClient();
    const objects: SavedObjectLike[] = [
      {
        id: 'dangling',
        type: 'visualization',
        ...indexRef('wazuh-alerts-*'),
        attributes: {
          ...indexRef('wazuh-alerts-*').attributes,
          visState: terms('rule.level'),
        },
      },
      {
        id: 'unloaded',
        type: 'visualization',
        ...indexRef('unloaded'),
        attributes: {
          ...indexRef('unloaded').attributes,
          visState: terms('rule.level'),
        },
      },
      { id: 'markdown', type: 'visualization', attributes: { visState: '{}' } },
      {
        id: 'malformed',
        type: 'visualization',
        ...indexRef('malformed'),
        attributes: {
          ...indexRef('malformed').attributes,
          visState: terms('rule.level'),
        },
      },
    ];

    expect(await scanMissingFields(objects, client)).toEqual([]);
  });
});

describe('findScannedObjects', () => {
  it('reads every page', async () => {
    const client = createClient();
    const page = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ id: String(i) }));
    client.find
      .mockResolvedValueOnce({
        saved_objects: page(1000),
        total: 1500,
      } as never)
      .mockResolvedValueOnce({
        saved_objects: page(500),
        total: 1500,
      } as never);

    expect(await findScannedObjects(client)).toHaveLength(1500);
    expect(
      client.find.mock.calls.map(
        ([options]) => (options as { page: number }).page,
      ),
    ).toEqual([1, 2]);
  });
});

describe('getScannedObjects', () => {
  it('returns the found visualizations and saved searches, skipping unknown ids', async () => {
    const client = createClient([legacySearch]);

    expect(await getScannedObjects(client, ['legacy-search', 'nope'])).toEqual([
      legacySearch,
    ]);
    expect(await getScannedObjects(client, [])).toEqual([]);
  });
});
