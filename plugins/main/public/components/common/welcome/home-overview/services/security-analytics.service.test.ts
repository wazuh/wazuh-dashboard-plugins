import { getHttp } from '../../../../../kibana-services';
import {
  fetchDecodersCount,
  fetchDetectorsCount,
  fetchIntegrationsCount,
  fetchRulesCount,
  SECURITY_ANALYTICS_ROUTES,
} from './security-analytics.service';
import { ErrorDataSourceNotFound } from '../../../../../utils/errors';

jest.mock('../../../../../kibana-services', () => ({
  getHttp: jest.fn(),
}));

const asMock = (fn: unknown) => fn as jest.Mock;

const SPACES_AND_ENABLED = {
  bool: {
    filter: [
      { terms: { 'space.name': ['standard', 'custom'] } },
      { term: { 'document.enabled': true } },
    ],
  },
};

describe('fetchRulesCount', () => {
  it('sums enabled pre-packaged (standard) + custom rules across two calls', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        response: { hits: { total: { value: 482 } } },
      })
      .mockResolvedValueOnce({
        ok: true,
        response: { hits: { total: { value: 18 } } },
      });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchRulesCount()).toBe(500);
    expect(post).toHaveBeenCalledTimes(2);
    const [route, standardOpts] = post.mock.calls[0];
    const [, customOpts] = post.mock.calls[1];
    expect(route).toBe(SECURITY_ANALYTICS_ROUTES.rulesSearch);
    expect(standardOpts.query).toEqual({ prePackaged: true });
    expect(customOpts.query).toEqual({ prePackaged: false });
    // Each call filters to enabled only (the space comes from prePackaged).
    // Verified live: a bare `{ size: 0 }` throws `illegal_argument_exception`,
    // so an explicit query is required.
    const enabledQuery = {
      size: 0,
      query: { term: { 'document.enabled': true } },
    };
    expect(JSON.parse(standardOpts.body)).toEqual(enabledQuery);
    expect(JSON.parse(customOpts.body)).toEqual(enabledQuery);
  });

  it('rethrows error', async () => {
    const post = jest.fn().mockRejectedValue({ statusCode: 404 });
    asMock(getHttp).mockReturnValue({ post });

    await expect(fetchRulesCount()).rejects.toMatchObject({ statusCode: 404 });
  });

  it('treats an in-envelope ok:false as a real query failure', async () => {
    const post = jest.fn().mockResolvedValue({ ok: false, error: 'boom' });
    asMock(getHttp).mockReturnValue({ post });

    await expect(fetchRulesCount()).rejects.toThrow('boom');
  });

  it('treats "no handler found for uri" as capability-absent (cluster plugin lacks the endpoint)', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: false,
      error:
        'no handler found for uri [/_plugins/_security_analytics/rules/_search] and method [POST]',
    });
    asMock(getHttp).mockReturnValue({ post });

    await expect(fetchRulesCount()).rejects.toBeInstanceOf(
      ErrorDataSourceNotFound,
    );
  });
});

describe('fetchDecodersCount', () => {
  it('counts enabled decoders across both spaces, reading response.total', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { total: 128, items: [] },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchDecodersCount()).toBe(128);
    const [, options] = post.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      size: 0,
      query: SPACES_AND_ENABLED,
    });
  });
});

describe('fetchIntegrationsCount', () => {
  it('counts enabled integrations across both spaces (body is the query), reading hits.total', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { hits: { total: 14 } },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchIntegrationsCount()).toBe(14);
    const [, options] = post.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      size: 0,
      ...SPACES_AND_ENABLED,
    });
  });
});

describe('fetchDetectorsCount', () => {
  it('sends size:0 with an explicit match_all query and reads hits.total', async () => {
    const post = jest.fn().mockResolvedValue({
      ok: true,
      response: { hits: { total: { value: 9 } } },
    });
    asMock(getHttp).mockReturnValue({ post });

    expect(await fetchDetectorsCount()).toBe(9);
    const [, options] = post.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      size: 0,
      query: { match_all: {} },
    });
  });
});
