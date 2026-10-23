/* eslint-disable camelcase -- CTI consumer and query fields keep their API names */
jest.mock('../plugin-services', () => ({
  getCore: jest.fn(),
}));

import { getCore } from '../plugin-services';
import { routes } from '../../common/constants';
import {
  fetchCtiConsumers,
  fetchFeedContentCounts,
  requestCtiContentUpdate,
} from './cti-feed';

const mockGet = jest.fn();
const mockPost = jest.fn();

const searchResponse = (total: number) => ({
  ok: true,
  response: { hits: { total: { value: total } } },
});

describe('cti-feed services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCore as jest.Mock).mockReturnValue({
      http: { get: mockGet, post: mockPost },
    });
  });

  describe('fetchFeedContentCounts', () => {
    test('counts the feed content in the standard space', async () => {
      mockPost.mockImplementation((route: string) => {
        if (route.includes('/rules/')) {
          return Promise.resolve(searchResponse(365));
        }
        if (route.includes('/decoders/')) {
          // Decoders report the total at the top level of the response.
          return Promise.resolve({ ok: true, response: { total: 514 } });
        }
        if (route.includes('/integrations/')) {
          return Promise.resolve(searchResponse(127));
        }
        return Promise.resolve(searchResponse(49));
      });
      mockGet.mockResolvedValue({ iocs: 672843, vulnerabilities: 402878 });

      await expect(fetchFeedContentCounts()).resolves.toEqual({
        rules: 365,
        decoders: 514,
        integrations: 127,
        kvdbs: 49,
        iocs: 672843,
        vulnerabilities: 402878,
      });

      expect(mockGet).toHaveBeenCalledWith(routes.ctiFeedIndicators);
      expect(mockPost).toHaveBeenCalledWith(
        '/_plugins/_security_analytics/rules/_search',
        {
          body: JSON.stringify({ size: 0, query: { match_all: {} } }),
          query: { prePackaged: true },
        },
      );
      expect(mockPost).toHaveBeenCalledWith(
        '/_plugins/_security_analytics/decoders/_search',
        {
          body: JSON.stringify({
            size: 0,
            query: { term: { 'space.name': 'standard' } },
          }),
        },
      );
      // The integrations route takes the filter at the top level.
      expect(mockPost).toHaveBeenCalledWith(
        '/_plugins/_security_analytics/integrations/_search',
        {
          body: JSON.stringify({
            size: 0,
            term: { 'space.name': 'standard' },
          }),
        },
      );
    });

    test('blanks only the counts that fail', async () => {
      mockPost.mockImplementation((route: string) => {
        if (route.includes('/rules/')) {
          return Promise.reject(new Error('Not Found'));
        }
        if (route.includes('/kvdbs/')) {
          return Promise.resolve({
            ok: false,
            error: 'no handler found for uri',
          });
        }
        return Promise.resolve(searchResponse(3));
      });
      mockGet.mockRejectedValue(new Error('Forbidden'));

      await expect(fetchFeedContentCounts()).resolves.toEqual({
        rules: null,
        decoders: 3,
        integrations: 3,
        kvdbs: null,
        iocs: null,
        vulnerabilities: null,
      });
    });

    test('keeps a null indicator count from the server', async () => {
      mockPost.mockResolvedValue(searchResponse(1));
      mockGet.mockResolvedValue({ iocs: 5, vulnerabilities: null });

      const counts = await fetchFeedContentCounts();

      expect(counts.iocs).toBe(5);
      expect(counts.vulnerabilities).toBeNull();
    });
  });

  test('fetchCtiConsumers reads the consumers route', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await expect(fetchCtiConsumers()).resolves.toEqual({ data: [] });
    expect(mockGet).toHaveBeenCalledWith(routes.ctiConsumers);
  });

  test('requestCtiContentUpdate posts to the update route', async () => {
    mockPost.mockResolvedValue({});

    await requestCtiContentUpdate();

    expect(mockPost).toHaveBeenCalledWith(routes.ctiFeedContentUpdate);
  });
});
