import { WazuhAiCtrl } from '../controllers/wazuh-ai';

/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
jest.mock('needle', () => jest.fn());

// Needle has no TypeScript declaration in this plugin.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const needle = require('needle') as jest.Mock;
const controller = new WazuhAiCtrl();
const alertIndex = 'wazuh-alerts-4.x-2026.10.24';
const alertId = 'synthetic-alert-id';
const source = {
  '@timestamp': '2026-10-24T10:00:00.000Z',
  timestamp: '2026-10-24T10:00:00.000Z',
  rule: {
    id: '1001',
    level: 8,
    description: 'Synthetic authentication failure',
    groups: ['authentication_failed'],
    mitre: { id: ['T1110'], tactic: ['Credential Access'] },
  },
  decoder: { name: 'sshd' },
  agent: { id: '007', name: 'private-hostname', ip: '192.0.2.20' },
  data: {
    srcip: '198.51.100.42',
    dstport: '22',
    authentication_result: 'failed',
    dstuser: 'private-user',
    password: 'synthetic-secret',
    arbitrary: 'private-alert-detail',
  },
  full_log: 'private raw log content',
  email: 'private@example.invalid',
};

const originalInternalToken = process.env.SOC_AI_INTERNAL_TOKEN;

const createContext = (username = 'analyst') => {
  const search = jest.fn().mockResolvedValue({
    body: { hits: { hits: [{ _source: source }] } },
  });
  return {
    wazuh: {
      security: {
        getCurrentUser: jest.fn().mockResolvedValue({ username }),
      },
    },
    wazuh_core: {
      configuration: {
        getSettingValue: jest.fn().mockResolvedValue('wazuh-alerts-*'),
      },
    },
    core: { opensearch: { client: { asCurrentUser: { search } } } },
    search,
  } as any;
};

const createResponse = () => ({
  ok: jest.fn(value => ({ statusCode: 200, ...value })),
  custom: jest.fn(value => value),
});

const createRequest = (username = 'analyst', body = {}) =>
  ({
    headers: { 'x-test-username': username },
    body: { index: alertIndex, id: alertId, ...body },
  } as any);

describe('POST /api/ai/analyze-alert controller authorization and privacy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SOC_AI_INTERNAL_TOKEN = 'synthetic-internal-token';
    needle.mockResolvedValue({
      statusCode: 200,
      body: { ok: true, analysis: 'Synthetic analysis result' },
    });
  });

  afterAll(() => {
    if (originalInternalToken === undefined) {
      delete process.env.SOC_AI_INTERNAL_TOKEN;
    } else {
      process.env.SOC_AI_INTERNAL_TOKEN = originalInternalToken;
    }
  });

  it('allows an analyst whose current OpenSearch user can search the alert', async () => {
    const context = createContext('soc-analyst');
    const response = createResponse();

    const result = await controller.analyzeAlert(
      context,
      createRequest('soc-analyst'),
      response as any,
    );

    expect(result).toEqual({
      statusCode: 200,
      body: { ok: true, analysis: 'Synthetic analysis result' },
    });
    expect(context.search).toHaveBeenCalledWith({
      index: alertIndex,
      body: {
        size: 1,
        // OpenSearch uses this API field name.
        // eslint-disable-next-line camelcase
        track_total_hits: false,
        query: { ids: { values: [alertId] } },
        _source: expect.arrayContaining([
          '@timestamp',
          'rule.id',
          'agent.id',
          'data.srcip',
        ]),
      },
    });
  });

  it('allows an administrator through the same current-user OpenSearch check', async () => {
    const context = createContext('admin');
    const response = createResponse();

    const result = await controller.analyzeAlert(
      context,
      createRequest('admin'),
      response as any,
    );

    expect(result.statusCode).toBe(200);
    expect(context.search).toHaveBeenCalledTimes(1);
  });

  it('rejects a request without an authenticated Wazuh user', async () => {
    const context = createContext();
    context.wazuh.security.getCurrentUser.mockResolvedValue(null);
    const response = createResponse();

    const result = await controller.analyzeAlert(
      context,
      createRequest(),
      response as any,
    );

    expect(result.statusCode).toBe(401);
    expect(context.search).not.toHaveBeenCalled();
    expect(needle).not.toHaveBeenCalled();
  });

  it(
    'denies a user whose OpenSearch search is forbidden without calling the AI service',
    async () => {
      const context = createContext('restricted-user');
      context.search.mockRejectedValue({ meta: { statusCode: 403 } });
      const response = createResponse();

      const result = await controller.analyzeAlert(
        context,
        createRequest('restricted-user'),
        response as any,
      );

      expect(result).toEqual({
        statusCode: 403,
        body: { ok: false, error: 'Access to this alert is denied' },
      });
      expect(needle).not.toHaveBeenCalled();
    },
  );

  it('does not disclose alerts hidden by document-level security', async () => {
    const context = createContext('scoped-analyst');
    context.search.mockResolvedValue({ body: { hits: { hits: [] } } });
    const response = createResponse();

    const result = await controller.analyzeAlert(
      context,
      createRequest('scoped-analyst'),
      response as any,
    );

    expect(result).toEqual({
      statusCode: 404,
      body: { ok: false, error: 'Alert is unavailable' },
    });
    expect(needle).not.toHaveBeenCalled();
  });

  it('forwards only allowlisted fields and ignores client-supplied alert content', async () => {
    const context = createContext();
    const response = createResponse();
    const request = createRequest('analyst', {
      alert: { full_log: 'client-injected-sensitive-content' },
    });

    await controller.analyzeAlert(context, request, response as any);

    const forwardedAlert = needle.mock.calls[0][2].alert;
    expect(forwardedAlert).toEqual({
      '@timestamp': source['@timestamp'],
      timestamp: source.timestamp,
      rule: source.rule,
      decoder: source.decoder,
      agent: { id: source.agent.id },
      data: {
        srcip: source.data.srcip,
        dstport: source.data.dstport,
        authentication_result: source.data.authentication_result,
      },
    });
    const forwardedJson = JSON.stringify(forwardedAlert);
    [
      'private-hostname',
      '192.0.2.20',
      'private-user',
      'synthetic-secret',
      'private-alert-detail',
      'private raw log content',
      'private@example.invalid',
      'client-injected-sensitive-content',
    ].forEach(value => expect(forwardedJson).not.toContain(value));
  });

  it('rejects an index outside the configured Wazuh alert pattern', async () => {
    const context = createContext();
    const response = createResponse();

    const result = await controller.analyzeAlert(
      context,
      createRequest('analyst', { index: 'other-index-2026.10.24' }),
      response as any,
    );

    expect(result.statusCode).toBe(400);
    expect(context.search).not.toHaveBeenCalled();
    expect(needle).not.toHaveBeenCalled();
  });
});
