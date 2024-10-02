import React from 'react';
import { SearchResponse } from '@opensearch-project/opensearch/api/types';
import { render } from '@testing-library/react';
import {
  IndexPattern,
  TimeRange,
} from '../../../../../../src/plugins/data/common';
import WazuhDataGrid from './wz-data-grid';
import { PaginationOptions, tDataGridColumn } from '../data-grid';
import { tFilter } from '../data-source';

jest.mock('../../../kibana-services', () => ({
  getWazuhCorePlugin: jest.fn().mockImplementation(() => {
    return {
      hooks: {
        useDockedSideNav: jest.fn().mockImplementation(() => true),
      },
    };
  }),
}));

describe('WazuhDataGrid', () => {
  let mockOnChangePagination: jest.Mock;
  let mockOnChangeSorting: jest.Mock;
  let mockResults: SearchResponse;
  let mockIndexPatternMock: IndexPattern;
  let mockDefaultColumnsMock: tDataGridColumn[];
  let mockDefaultPaginationMock: PaginationOptions;
  let mockTimeRangeMock: TimeRange;
  let mockExportFilters: tFilter[];

  beforeEach(() => {
    mockOnChangePagination = jest.fn();
    mockOnChangeSorting = jest.fn();
    mockResults = {
      took: 6,
      timed_out: false,
      _shards: {
        total: 9,
        successful: 9,
        skipped: 0,
        failed: 0,
      },
      hits: {
        total: 1,
        max_score: 0,
        hits: [
          {
            _index: 'wazuh-alerts-4.x-sample-security',
            _id: 'EexXSZIBE_oA_ZslejwA',
            _score: 0,
            _source: {
              predecoder: {},
              cluster: {
                node: 'wazuh',
                name: 'wazuh',
              },
              agent: {
                ip: '207.45.34.78',
                name: 'Windows',
                id: '006',
              },
              manager: {
                name: 'wazuh-manager-master-0',
              },
              data: {
                github: {
                  actor: 'User7',
                  '@timestamp': '2024-10-01T18:24:43.468+0000',
                  visibility: 'private',
                  org: 'Organization1',
                  repo: 'Organization1/Repo4',
                  created_at: '2024-10-01T18:24:43.468+0000',
                  action: 'repo.create',
                  actor_location: {
                    country_code: 'CA',
                  },
                  _document_id: 'AcrdSmMW0PpEEmuGWiTcoQ',
                },
              },
              '@sampledata': true,
              rule: {
                firedtimes: 1,
                mail: false,
                level: 5,
                description: 'GitHub Repo create.',
                groups: ['github', 'git', 'git_repo'],
                id: '91318',
              },
              location: 'github',
              id: '1580123327.49031',
              decoder: {
                name: 'json',
              },
              timestamp: '2024-10-01T18:24:43.468+0000',
            },
            fields: {
              timestamp: ['2024-10-01T18:24:43.468Z'],
            },
          },
        ],
      },
    };
    mockIndexPatternMock = {
      id: '48e5b251-5238-49bc-a4b5-446168ea167c',
      // @ts-expect-error
      fields: [],
    };
    mockDefaultColumnsMock = [
      {
        id: 'timestamp',
        isSortable: true,
        defaultSortDirection: 'desc',
      },
      {
        id: 'rule.description',
      },
      {
        id: 'data.github.org',
        displayAsText: 'Organization',
      },
      {
        id: 'data.github.actor',
        displayAsText: 'Actor',
      },
      {
        id: 'data.github.action',
        displayAsText: 'Action',
      },
      {
        id: 'rule.level',
      },
      {
        id: 'rule.id',
      },
    ];
    mockDefaultPaginationMock = {
      pageIndex: 0,
      pageSize: 15,
      pageSizeOptions: [15, 25, 50, 100],
    };
    mockTimeRangeMock = {
      from: '2024-10-01T15:36:13.085Z',
      to: '2024-10-02T15:36:13.085Z',
    };
    mockExportFilters = [
      {
        meta: {
          removable: false,
          index: 'wazuh-alerts-*',
          negate: false,
          disabled: false,
          alias: null,
          type: 'phrase',
          key: 'cluster.name',
          value: 'wazuh',
          params: {
            query: 'wazuh',
            type: 'phrase',
          },
          controlledBy: 'cluster-manager',
        },
        query: {
          match: {
            'cluster.name': {
              query: 'wazuh',
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      },
      {
        meta: {
          index: 'wazuh-alerts-*',
          negate: false,
          disabled: false,
          alias: null,
          type: 'phrase',
          key: 'rule.groups',
          value: 'github',
          params: {
            query: 'github',
            type: 'phrase',
          },
          controlledBy: 'github-rule-group',
        },
        query: {
          match: {
            'rule.groups': {
              query: 'github',
              type: 'phrase',
            },
          },
        },
        $state: {
          store: 'appState',
        },
      },
      {
        meta: {
          alias: null,
          disabled: false,
          key: 'data.github.repo',
          value: 'Organization1/Repo4',
          params: ['Organization1/Repo4'],
          negate: false,
          type: 'phrases',
          index: 'wazuh-alerts-*',
          controlledBy: 'github-panel-row-filter',
        },
        query: {
          bool: {
            minimum_should_match: 1,
            should: [
              {
                match_phrase: {
                  'data.github.repo': {
                    query: 'Organization1/Repo4',
                  },
                },
              },
            ],
          },
        },
        $state: {
          store: 'appState',
        },
      },
    ];
  });

  it('should render correctly', () => {
    const { container } = render(
      <WazuhDataGrid
        results={mockResults}
        defaultColumns={mockDefaultColumnsMock}
        defaultPagination={mockDefaultPaginationMock}
        indexPattern={mockIndexPatternMock}
        exportFilters={mockExportFilters}
        isLoading={false}
        onChangePagination={mockOnChangePagination}
        onChangeSorting={mockOnChangeSorting}
        dateRange={mockTimeRangeMock}
      />,
    );

    expect(container).toBeTruthy();
  });
});
