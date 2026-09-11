/* eslint-disable camelcase -- fixtures reproduce the manager API's field
   names verbatim. */
import {
  getSearchableSettingsData,
  clearSettingsSearchDataCache,
} from './settings-search-service';
import { getAgentReportedConfiguration } from './agent-config-service';
import { WzRequest } from '../../../../../../react-services/wz-request';
import { SearchableSettingField } from './searchable-settings-registry';

jest.mock('./agent-config-service', () => ({
  getAgentReportedConfiguration: jest.fn(),
}));

jest.mock('../../../../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));

const apiReq = WzRequest.apiReq as jest.Mock;

const authPortField: SearchableSettingField = {
  id: 'a.port',
  label: 'Port',
  category: 'A',
  goto: 'a',
  appliesTo: 'manager',
  manager: {
    request: { kind: 'regular', component: 'auth', configuration: 'auth' },
    path: 'auth.port',
  },
};

const authEnabledField: SearchableSettingField = {
  id: 'b.enabled',
  label: 'Enabled',
  category: 'B',
  goto: 'b',
  appliesTo: 'manager',
  manager: {
    request: { kind: 'regular', component: 'auth', configuration: 'auth' },
    path: 'auth.enabled',
  },
};

const clusterNameField: SearchableSettingField = {
  id: 'c.name',
  label: 'Name',
  category: 'C',
  goto: 'c',
  appliesTo: 'manager',
  manager: { request: { kind: 'fullEndpoint', key: 'cluster' }, path: 'name' },
};

const indexerHostsField: SearchableSettingField = {
  id: 'd.hosts',
  label: 'Hosts',
  category: 'D',
  goto: 'd',
  appliesTo: 'manager',
  manager: { request: { kind: 'fullEndpoint', key: 'indexer' }, path: 'hosts' },
};

const remotePortField: SearchableSettingField = {
  id: 'e.port',
  label: 'Port',
  category: 'E',
  goto: 'e',
  appliesTo: 'manager',
  manager: {
    request: { kind: 'regular', component: 'request', configuration: 'remote' },
    path: 'remote.https.port',
  },
};

const vulnerabilityEnabledField: SearchableSettingField = {
  id: 'f.enabled',
  label: 'Enabled',
  category: 'F',
  goto: 'f',
  appliesTo: 'manager',
  manager: {
    request: {
      kind: 'regular',
      component: 'wmodules',
      configuration: 'wmodules',
    },
    path: 'enabled',
    unwrap: raw => {
      const wmodules = (raw as { wmodules?: unknown[] })?.wmodules;
      return Array.isArray(wmodules)
        ? (wmodules as Record<string, unknown>[]).find(
            item => item?.['vulnerability-detection'],
          )?.['vulnerability-detection']
        : undefined;
    },
  },
};

const agentXField: SearchableSettingField = {
  id: 'x.value',
  label: 'X',
  category: 'X',
  goto: 'x',
  appliesTo: 'agent',
  agentPath: 'fim.x',
};

describe('getSearchableSettingsData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearSettingsSearchDataCache();
  });

  it('rejects a missing agent id', async () => {
    await expect(
      getSearchableSettingsData(
        undefined as unknown as string,
        false,
        [],
        jest.fn(),
      ),
    ).rejects.toThrow('Invalid parameters');
  });

  describe('manager branch', () => {
    it('dedupes an identical regular request shared by two fields into one call', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: {
            total_affected_items: 1,
            affected_items: [{ auth: { port: 1515, enabled: true } }],
          },
        },
      });

      const result = await getSearchableSettingsData(
        'node01',
        'node01',
        [authPortField, authEnabledField],
        jest.fn(),
      );

      expect(apiReq).toHaveBeenCalledTimes(1);
      expect(apiReq).toHaveBeenCalledWith(
        'GET',
        '/cluster/node01/configuration/auth/auth',
        {},
      );
      expect(result.values).toEqual({ 'a.port': 1515, 'b.enabled': true });
    });

    it('batches multiple full-endpoint keys from different sections into one request', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: {
            total_affected_items: 1,
            affected_items: [
              { cluster: { name: 'wazuh' }, indexer: { hosts: ['127.0.0.1'] } },
            ],
          },
        },
      });

      const result = await getSearchableSettingsData(
        'node01',
        'node01',
        [clusterNameField, indexerHostsField],
        jest.fn(),
      );

      expect(apiReq).toHaveBeenCalledTimes(1);
      expect(apiReq).toHaveBeenCalledWith(
        'GET',
        '/cluster/node01/configuration',
        {},
      );
      expect(result.values).toEqual({
        'c.name': 'wazuh',
        'd.hosts': ['127.0.0.1'],
      });
    });

    it('marks a failed source as an error without blanking other fields', async () => {
      apiReq.mockImplementation((_method: string, url: string) => {
        if (url === '/cluster/node01/configuration/auth/auth') {
          return Promise.reject(new Error('boom'));
        }
        return Promise.resolve({
          data: {
            data: {
              total_affected_items: 1,
              affected_items: [{ cluster: { name: 'wazuh' } }],
            },
          },
        });
      });

      const result = await getSearchableSettingsData(
        'node01',
        'node01',
        [clusterNameField, authPortField],
        jest.fn(),
      );

      expect(result.values['c.name']).toBe('wazuh');
      expect(result.values['a.port']).toBeUndefined();
      expect(result.sources['auth-auth'].status).toBe('error');
    });

    it('normalizes an array-shaped `remote` before resolving a path through it', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: {
            total_affected_items: 1,
            affected_items: [{ remote: [{ https: { port: '1517' } }] }],
          },
        },
      });

      const result = await getSearchableSettingsData(
        'node01',
        'node01',
        [remotePortField],
        jest.fn(),
      );

      expect(result.values['e.port']).toBe('1517');
    });

    it('resolves a value nested in the wmodules array via unwrap', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: {
            total_affected_items: 1,
            affected_items: [
              {
                wmodules: [
                  { 'vulnerability-detection': { enabled: 'yes' } },
                  { 'aws-s3': {} },
                ],
              },
            ],
          },
        },
      });

      const result = await getSearchableSettingsData(
        'node01',
        'node01',
        [vulnerabilityEnabledField],
        jest.fn(),
      );

      expect(result.values['f.enabled']).toBe('yes');
    });

    it('caches the read for the same node', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: { total_affected_items: 1, affected_items: [{ auth: {} }] },
        },
      });

      await getSearchableSettingsData(
        'node01',
        'node01',
        [authPortField],
        jest.fn(),
      );
      await getSearchableSettingsData(
        'node01',
        'node01',
        [authPortField],
        jest.fn(),
      );

      expect(apiReq).toHaveBeenCalledTimes(1);
    });

    it('reads again for a different node', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: { total_affected_items: 1, affected_items: [{ auth: {} }] },
        },
      });

      await getSearchableSettingsData(
        'node01',
        'node01',
        [authPortField],
        jest.fn(),
      );
      await getSearchableSettingsData(
        'node02',
        'node02',
        [authPortField],
        jest.fn(),
      );

      expect(apiReq).toHaveBeenCalledTimes(2);
    });

    it('reads again once the cache is cleared', async () => {
      apiReq.mockResolvedValue({
        data: {
          data: { total_affected_items: 1, affected_items: [{ auth: {} }] },
        },
      });

      await getSearchableSettingsData(
        'node01',
        'node01',
        [authPortField],
        jest.fn(),
      );
      clearSettingsSearchDataCache();
      await getSearchableSettingsData(
        'node01',
        'node01',
        [authPortField],
        jest.fn(),
      );

      expect(apiReq).toHaveBeenCalledTimes(2);
    });
  });

  describe('agent branch', () => {
    it('reuses getAgentReportedConfiguration and never calls the Server API', async () => {
      (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
        content: { fim: { x: 'value' } },
      });

      const result = await getSearchableSettingsData(
        '001',
        false,
        [agentXField],
        jest.fn(),
      );

      expect(getAgentReportedConfiguration).toHaveBeenCalledWith('001');
      expect(apiReq).not.toHaveBeenCalled();
      expect(result.values).toEqual({ 'x.value': 'value' });
    });

    it('skips manager-only fields entirely', async () => {
      (getAgentReportedConfiguration as jest.Mock).mockResolvedValue({
        content: {},
      });

      const result = await getSearchableSettingsData(
        '001',
        false,
        [agentXField, authPortField],
        jest.fn(),
      );

      expect(result.values).toEqual({ 'x.value': undefined });
    });
  });
});
