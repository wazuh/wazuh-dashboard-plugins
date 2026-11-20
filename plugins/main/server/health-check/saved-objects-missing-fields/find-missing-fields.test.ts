/* eslint-disable camelcase -- query DSL clauses */
import {
  collectReferencedFields,
  extractQueryFields,
  findMissingFields,
  resolveSource,
  SavedObjectLike,
} from './find-missing-fields';

const searchSourceJSON = (searchSource: object) => ({
  kibanaSavedObjectMeta: { searchSourceJSON: JSON.stringify(searchSource) },
});

const visualization = (
  aggs: object[],
  searchSource: object = {},
): SavedObjectLike => ({
  id: 'vis',
  type: 'visualization',
  attributes: {
    title: 'Vis',
    visState: JSON.stringify({ aggs }),
    ...searchSourceJSON(searchSource),
  },
});

const usage = (so: SavedObjectLike) =>
  Object.fromEntries(
    [...collectReferencedFields(so)].map(([field, where]) => [
      field,
      [...where].sort(),
    ]),
  );

describe('extractQueryFields', () => {
  it.each([
    [
      'KQL',
      'rule.level >= 10 and agent.name : "srv:01"',
      ['rule.level', 'agent.name'],
    ],
    [
      'Lucene',
      'rule.groups:"authentication_failed" AND NOT data.srcuser:root',
      ['rule.groups', 'data.srcuser'],
    ],
    ['Lucene exists', '_exists_:data.srcip', ['data.srcip']],
    [
      'grouped',
      '(rule.level:3 OR rule.level:5) AND -location:x',
      ['rule.level', 'location'],
    ],
    ['free text', 'failed password', []],
    ['unquoted value with a colon', 'url: foo-bar:baz and a:1', ['url', 'a']],
    [
      'KQL nested',
      'user:{ name: x and group:{ id > 3 } } or host:y',
      ['user.name', 'user.group.id', 'host'],
    ],
    [
      'Lucene ranges',
      'rule.level:[3 TO 5] OR rule.id:{100 TO 200} AND x:1',
      ['rule.level', 'rule.id', 'x'],
    ],
    [
      'Lucene ranges with times',
      'timestamp:{2024-01-01T00:00:00 TO *} AND rule.level:[3 TO 5]',
      ['timestamp', 'rule.level'],
    ],
    ['empty', '', []],
  ])('reads the fields of a %s query', (_, query, fields) => {
    expect(extractQueryFields(query).sort()).toEqual([...fields].sort());
  });

  it('ignores colons inside quoted values and URLs', () => {
    expect(extractQueryFields('url:"http://a:80" or path:http://b')).toEqual([
      'url',
      'path',
    ]);
  });
});

describe('collectReferencedFields', () => {
  it('reads the query, enabled filters and aggregations of a visualization', () => {
    const so = visualization(
      [
        { type: 'count', params: {} },
        {
          type: 'terms',
          params: {
            field: 'rule.groups',
            orderAgg: { params: { field: 'rule.level' } },
          },
        },
        {
          type: 'top_hits',
          params: { field: 'agent.id', sortField: 'timestamp' },
        },
        {
          type: 'filters',
          params: { filters: [{ input: { query: 'rule.mitre.id : T1110' } }] },
        },
      ],
      {
        query: { query: 'rule.firedtimes > 5', language: 'kuery' },
        filter: [
          {
            meta: { key: 'data.srcip' },
            query: { match_phrase: { 'data.srcip': '1' } },
          },
          { meta: { key: 'disabled.field', disabled: true } },
          { query: { range: { 'data.port': { gte: 1 } } }, meta: {} },
          { exists: { field: 'data.dstip' }, meta: {} },
        ],
      },
    );

    expect(usage(so)).toEqual({
      'rule.firedtimes': ['query'],
      'data.srcip': ['filter'],
      'data.port': ['filter'],
      'data.dstip': ['filter'],
      'rule.groups': ['aggregation'],
      'rule.level': ['aggregation'],
      'agent.id': ['aggregation'],
      timestamp: ['aggregation'],
      'rule.mitre.id': ['aggregation'],
    });
  });

  it('reads the columns and sort of a saved search, in both sort formats', () => {
    const search = (sort: unknown[]): SavedObjectLike => ({
      id: 'search',
      type: 'search',
      attributes: {
        columns: ['_source', 'rule.description', 'rule.groups'],
        sort,
        ...searchSourceJSON({
          query: { query: 'rule.groups:x', language: 'lucene' },
        }),
      },
    });

    expect(usage(search([['timestamp', 'desc']]))).toEqual({
      'rule.groups': ['column', 'query'],
      'rule.description': ['column'],
      timestamp: ['sort'],
    });
    expect(usage(search(['timestamp', 'desc'])).timestamp).toEqual(['sort']);
  });

  it('survives malformed JSON', () => {
    const so: SavedObjectLike = {
      id: 'broken',
      type: 'visualization',
      attributes: {
        visState: '{',
        kibanaSavedObjectMeta: { searchSourceJSON: 'nope' },
      },
    };

    expect(collectReferencedFields(so).size).toBe(0);
  });
});

describe('custom filters', () => {
  const withFilters = (filter: object[]) =>
    usage(visualization([], { filter }));

  it('reads the fields of bool, query_string and nested clauses', () => {
    expect(
      withFilters([
        {
          meta: { type: 'custom', key: 'query' },
          query: {
            bool: {
              must: [{ term: { 'agent.id': '001' } }],
              should: { query_string: { query: 'rule.level:>10' } },
              must_not: [
                { nested: { path: 'a', query: { match: { 'a.b': 1 } } } },
                { constant_score: { filter: { exists: { field: 'c' } } } },
              ],
            },
          },
        },
        {
          meta: { type: 'query_string', key: 'query' },
          query: { query_string: { query: 'data.srcuser:root' } },
        },
      ]),
    ).toEqual({
      'agent.id': ['filter'],
      'rule.level': ['filter'],
      'a.b': ['filter'],
      c: ['filter'],
      'data.srcuser': ['filter'],
    });
  });

  it('skips script clauses, but keeps the field of a scripted field filter', () => {
    expect(
      withFilters([
        { meta: { type: 'custom', key: 'script' }, script: { script: {} } },
        { meta: { type: 'phrase', key: 'hour' }, script: { script: {} } },
      ]),
    ).toEqual({ hour: ['filter'] });
  });
});

describe('resolveSource', () => {
  it('follows the index reference', () => {
    expect(
      resolveSource({
        id: 'vis',
        type: 'visualization',
        attributes: searchSourceJSON({ indexRefName: 'ref_0' }),
        references: [{ name: 'ref_0', type: 'index-pattern', id: 'findings' }],
      }),
    ).toEqual({ indexPatternId: 'findings' });
  });

  it('returns the saved search a visualization is built on', () => {
    expect(
      resolveSource({
        id: 'vis',
        type: 'visualization',
        attributes: { savedSearchRefName: 'search_0', ...searchSourceJSON({}) },
        references: [{ name: 'search_0', type: 'search', id: 'legacy' }],
      }),
    ).toEqual({ savedSearchId: 'legacy' });
  });

  it('falls back to the legacy savedSearchId attribute', () => {
    expect(
      resolveSource({
        id: 'vis',
        type: 'visualization',
        attributes: { savedSearchId: 'legacy', ...searchSourceJSON({}) },
      }),
    ).toEqual({ savedSearchId: 'legacy' });
  });

  it('returns nothing for visualizations with no index pattern', () => {
    expect(
      resolveSource({ id: 'md', type: 'visualization', attributes: {} }),
    ).toEqual({});
  });
});

describe('findMissingFields', () => {
  it('lists the fields the index pattern lacks, sorted', () => {
    const so = visualization([
      { params: { field: 'rule.level' } },
      { params: { field: 'agent.name' } },
      { params: { field: 'data.*' } },
      { params: { field: 'event.*' } },
    ]);

    expect(
      findMissingFields(so, new Set(['agent.name', 'event.severity'])),
    ).toEqual([
      { field: 'data.*', usedIn: ['aggregation'] },
      { field: 'rule.level', usedIn: ['aggregation'] },
    ]);
  });
});
