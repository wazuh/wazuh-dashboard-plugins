import { WzRequest } from '../../../../../../../../../react-services/wz-request';
import {
  fetchTechniqueFamily,
  getHighestSeverity,
  getParentTechniqueId,
  parseStats,
  resolveCitations,
} from './technique';

jest.mock('../../../../../../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

const references = [
  { source: 'Dragos', url: 'https://example.com/dragos' },
  { source: 'Trend', url: 'https://example.com/trend' },
  { source: 'No URL' },
];

describe('resolveCitations', () => {
  it('numbers the citations in order of appearance and links them', () => {
    expect(
      resolveCitations(
        'One.(Citation: Trend) Two.(Citation: Dragos) Three.(Citation: Trend)',
        references,
      ),
    ).toBe(
      'One.[[1]](https://example.com/trend "Trend") Two.[[2]](https://example.com/dragos "Dragos") Three.[[1]](https://example.com/trend "Trend")',
    );
  });

  it('removes the citations without a reference URL', () => {
    expect(
      resolveCitations(
        'A.(Citation: No URL) B.(Citation: Unknown)',
        references,
      ),
    ).toBe('A. B.');
  });
});

describe('getParentTechniqueId', () => {
  it.each([
    ['T1110.001', 'T1110'],
    ['T1110', undefined],
  ])('%s → %s', (id, expected) => {
    expect(getParentTechniqueId(id)).toBe(expected);
  });
});

describe('getHighestSeverity', () => {
  it('ranks the levels from critical to informational', () => {
    expect(getHighestSeverity(['low', 'high', 'medium'])).toBe('high');
    expect(getHighestSeverity([])).toBeUndefined();
  });
});

describe('parseStats', () => {
  it('reads the total, agents, highest severity and last seen', () => {
    expect(
      parseStats({
        hits: { total: { value: 175, relation: 'eq' } },
        aggregations: {
          agents: { value: 8 },
          levels: { buckets: [{ key: 'medium' }, { key: 'critical' }] },
          lastSeen: { value: 1763479340000 },
        },
      }),
    ).toEqual({
      findings: 175,
      agents: 8,
      highestSeverity: 'critical',
      lastSeen: 1763479340000,
    });
  });

  it('returns empty stats when there are no findings', () => {
    expect(
      parseStats({
        hits: { total: 0 },
        aggregations: { agents: { value: 0 }, lastSeen: { value: null } },
      }),
    ).toEqual({
      findings: 0,
      agents: 0,
      highestSeverity: undefined,
      lastSeen: undefined,
    });
  });
});

describe('fetchTechniqueFamily', () => {
  beforeEach(() => apiReq.mockReset());

  it('gets the sub-techniques of a technique', async () => {
    const subtechniques = [{ external_id: 'T1110.001', name: 'Guessing' }];
    apiReq.mockResolvedValue({
      data: { data: { affected_items: subtechniques } },
    });

    await expect(fetchTechniqueFamily('T1110')).resolves.toEqual({
      subtechniques,
    });
    expect(apiReq).toHaveBeenCalledWith('GET', '/mitre/techniques', {
      params: expect.objectContaining({ q: 'external_id~T1110.' }),
    });
  });

  it('gets the parent of a sub-technique', async () => {
    const parent = { external_id: 'T1110', name: 'Brute Force' };
    apiReq.mockResolvedValue({ data: { data: { affected_items: [parent] } } });

    await expect(fetchTechniqueFamily('T1110.001')).resolves.toEqual({
      parent,
      subtechniques: [],
    });
    expect(apiReq).toHaveBeenCalledWith('GET', '/mitre/techniques', {
      params: { q: 'external_id=T1110' },
    });
  });
});
