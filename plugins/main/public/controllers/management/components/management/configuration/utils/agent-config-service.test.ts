/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import {
  clearAgentReportedConfigurationCache,
  getAgentReportedConfiguration,
} from './agent-config-service';
import { getDataPlugin } from '../../../../../../kibana-services';

jest.mock('../../../../../../kibana-services', () => ({
  getDataPlugin: jest.fn(),
}));

/* The chainable setters return the search source itself, so it needs an
explicit type: inferring it from an initializer that references it is circular. */
interface SearchSourceMock {
  setParent: jest.Mock;
  setField: jest.Mock;
  fetch: jest.Mock;
}

const buildSearchSource = (fetchResult: unknown) => {
  const searchSource: SearchSourceMock = {
    setParent: jest.fn(() => searchSource),
    setField: jest.fn(() => searchSource),
    fetch: jest.fn().mockResolvedValue(fetchResult),
  };
  return searchSource;
};

const mockDataPlugin = (fetchResult: unknown) => {
  const searchSource = buildSearchSource(fetchResult);
  const indexPatternsGet = jest.fn().mockResolvedValue({ id: 'index-pattern' });
  (getDataPlugin as jest.Mock).mockReturnValue({
    indexPatterns: { get: indexPatternsGet },
    search: {
      searchSource: { create: jest.fn().mockResolvedValue(searchSource) },
    },
  });
  return { searchSource, indexPatternsGet };
};

describe('getAgentReportedConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    /* The cache outlives a test, so each one starts from an unread report. */
    clearAgentReportedConfigurationCache();
  });

  it('returns the reported configuration keyed by module', async () => {
    mockDataPlugin({
      hits: {
        hits: [
          {
            _source: {
              state: { modified_at: '2026-08-10T10:15:30.000Z' },
              wazuh: {
                agent: {
                  id: '001',
                  configuration: {
                    modules: ['agent', 'fim'],
                    content: {
                      agent: { agent: { notify_time: 10 } },
                      fim: { syscheck: { disabled: 'no' } },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    const result = await getAgentReportedConfiguration('001');

    expect(result).toEqual({
      content: {
        agent: { agent: { notify_time: 10 } },
        fim: { syscheck: { disabled: 'no' } },
      },
      modules: ['agent', 'fim'],
      modifiedAt: '2026-08-10T10:15:30.000Z',
    });
  });

  it('queries the index by agent id', async () => {
    const { searchSource } = mockDataPlugin({ hits: { hits: [] } });

    await getAgentReportedConfiguration('002');

    expect(searchSource.setField).toHaveBeenCalledWith('query', {
      language: 'lucene',
      query: { term: { 'wazuh.agent.id': '002' } },
    });
  });

  it('returns null when the agent has never reported', async () => {
    mockDataPlugin({ hits: { hits: [] } });

    await expect(getAgentReportedConfiguration('001')).resolves.toBeNull();
  });

  it('normalizes a single reported module into a list', async () => {
    mockDataPlugin({
      hits: {
        hits: [
          {
            _source: {
              wazuh: {
                agent: {
                  configuration: { modules: 'fim', content: { fim: {} } },
                },
              },
            },
          },
        ],
      },
    });

    const result = await getAgentReportedConfiguration('001');

    expect(result?.modules).toEqual(['fim']);
  });

  it('tolerates a document without a configuration', async () => {
    mockDataPlugin({ hits: { hits: [{ _source: { wazuh: { agent: {} } } }] } });

    const result = await getAgentReportedConfiguration('001');

    expect(result).toEqual({ content: {}, modules: [], modifiedAt: undefined });
  });

  it('propagates a missing index pattern rather than reporting no data', async () => {
    (getDataPlugin as jest.Mock).mockReturnValue({
      indexPatterns: {
        get: jest.fn().mockRejectedValue(new Error('Index pattern not found')),
      },
      search: { searchSource: { create: jest.fn() } },
    });

    await expect(getAgentReportedConfiguration('001')).rejects.toThrow(
      'Index pattern not found',
    );
  });

  describe('caching', () => {
    const document = {
      hits: {
        hits: [
          {
            _source: {
              wazuh: {
                agent: {
                  configuration: { modules: ['fim'], content: { fim: {} } },
                },
              },
            },
          },
        ],
      },
    };

    it('reads the report once for every section of the same agent', async () => {
      const { searchSource } = mockDataPlugin(document);

      const first = await getAgentReportedConfiguration('001');
      const second = await getAgentReportedConfiguration('001');

      expect(searchSource.fetch).toHaveBeenCalledTimes(1);
      expect(second).toEqual(first);
    });

    it('joins the read already in flight instead of starting another', async () => {
      const { searchSource } = mockDataPlugin(document);

      await Promise.all([
        getAgentReportedConfiguration('001'),
        getAgentReportedConfiguration('001'),
        getAgentReportedConfiguration('001'),
      ]);

      expect(searchSource.fetch).toHaveBeenCalledTimes(1);
    });

    it('reads again for a different agent', async () => {
      const { searchSource } = mockDataPlugin(document);

      await getAgentReportedConfiguration('001');
      await getAgentReportedConfiguration('002');

      expect(searchSource.fetch).toHaveBeenCalledTimes(2);
      expect(searchSource.setField).toHaveBeenLastCalledWith('query', {
        language: 'lucene',
        query: { term: { 'wazuh.agent.id': '002' } },
      });
    });

    it('reads again once the cache is cleared', async () => {
      const { searchSource } = mockDataPlugin(document);

      await getAgentReportedConfiguration('001');
      clearAgentReportedConfigurationCache();
      await getAgentReportedConfiguration('001');

      expect(searchSource.fetch).toHaveBeenCalledTimes(2);
    });

    it('retries after a failed read rather than caching the failure', async () => {
      const { searchSource } = mockDataPlugin(document);
      searchSource.fetch.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(getAgentReportedConfiguration('001')).rejects.toThrow(
        'Forbidden',
      );
      const result = await getAgentReportedConfiguration('001');

      expect(searchSource.fetch).toHaveBeenCalledTimes(2);
      expect(result?.modules).toEqual(['fim']);
    });

    it('caches an agent that has never reported', async () => {
      const { searchSource } = mockDataPlugin({ hits: { hits: [] } });

      await expect(getAgentReportedConfiguration('001')).resolves.toBeNull();
      await expect(getAgentReportedConfiguration('001')).resolves.toBeNull();

      expect(searchSource.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
