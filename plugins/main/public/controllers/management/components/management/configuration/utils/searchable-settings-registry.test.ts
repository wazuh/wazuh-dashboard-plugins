/* eslint-disable camelcase -- fixtures reproduce the manager API's field
   names verbatim. */
import { get } from 'lodash';
import {
  searchableSettingsRegistry,
  configurationHeaders,
  configurationHeaderKey,
} from './searchable-settings-registry';

describe('searchableSettingsRegistry', () => {
  it('has a unique id for every field', () => {
    const ids = searchableSettingsRegistry.map(field => field.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every field a category, label and goto', () => {
    for (const entry of searchableSettingsRegistry) {
      expect(entry.category).toEqual(expect.any(String));
      expect(entry.goto).toEqual(expect.any(String));
      if (entry.kind === 'list') {
        expect(entry.title).toEqual(expect.any(String));
        expect(entry.itemLabel).toEqual(expect.any(Function));
        expect(entry.itemFields.length).toBeGreaterThan(0);
      } else {
        expect(entry.label).toEqual(expect.any(String));
      }
    }
  });

  it('gives every manager field a manager source and every agent field an agentPath or agentExtract', () => {
    for (const field of searchableSettingsRegistry) {
      if (field.appliesTo === 'manager') {
        expect(field.manager).toBeDefined();
        expect(field.agentPath).toBeUndefined();
        expect(field.agentExtract).toBeUndefined();
      } else {
        expect(field.agentPath ?? field.agentExtract).toBeDefined();
        expect(field.manager).toBeUndefined();
      }
    }
  });

  const findField = (id: string) => {
    const field = searchableSettingsRegistry.find(f => f.id === id);
    if (!field) {
      throw new Error(`Missing registry field: ${id}`);
    }
    return field;
  };

  it('resolves registration-service.port against auth-auth (regular request)', () => {
    const field = findField('registration-service.port');
    const merged = { 'auth-auth': { auth: { port: 1515 } } };
    expect(get(merged['auth-auth'], field.manager!.path)).toBe(1515);
  });

  it('resolves cluster.node_name against the full-endpoint cluster key', () => {
    const field = findField('cluster.node_name');
    const merged = { cluster: { node_name: 'node01' } };
    expect(get(merged.cluster, field.manager!.path)).toBe('node01');
  });

  it('resolves indexer.ssl.certificate_authorities and renders older/newer manager shapes the same', () => {
    const field = findField('indexer.ssl.certificate_authorities');
    const merged = {
      indexer: { ssl: { certificate_authorities: ['ca1.pem'] } },
    };
    const value = get(merged.indexer, field.manager!.path);
    expect(field.render!(value)).toBe('ca1.pem');

    const olderShape = {
      indexer: {
        ssl: { certificate_authorities: [{ ca: ['ca1.pem', 'ca2.pem'] }] },
      },
    };
    expect(field.render!(get(olderShape.indexer, field.manager!.path))).toBe(
      'ca1.pem, ca2.pem',
    );
  });

  it('resolves global-configuration.remote.https.port assuming the service already normalized `remote`', () => {
    const field = findField('global-configuration.remote.https.port');
    const merged = {
      'request-remote': { remote: { https: { port: '1517' } } },
    };
    expect(get(merged['request-remote'], field.manager!.path)).toBe('1517');
  });

  it('resolves the agent-only Global Configuration fields from execd.logging', () => {
    const plain = findField('global-configuration-agent.execd.logging.plain');
    const json = findField('global-configuration-agent.execd.logging.json');
    const content = { execd: { logging: { plain: 'yes', json: 'no' } } };

    expect(plain.render!(get(content, plain.agentPath!))).toBe('yes');
    expect(json.render!(get(content, json.agentPath!))).toBe('no');
  });

  it('resolves policy-monitoring fields from fim.rootcheck', () => {
    const field = findField('policy-monitoring.base_directory');
    const content = { fim: { rootcheck: { base_directory: '/' } } };
    expect(get(content, field.agentPath!)).toBe('/');
  });

  it('resolves client fields from agent.agent, including a batch sub-field', () => {
    const remoteConf = findField('client.remote_conf');
    const batchSize = findField('client.batch.size');
    const content = {
      agent: { agent: { remote_conf: 1, batch: { size: 1000 } } },
    };
    expect(get(content, remoteConf.agentPath!)).toBe(1);
    expect(get(content, batchSize.agentPath!)).toBe(1000);
  });

  it('extracts client.endpoint whether manager arrives as an object or a one-element array', () => {
    const field = findField('client.endpoint');
    const asObject = {
      agent: { agent: { manager: { endpoint: 'manager.example.com:1514' } } },
    };
    const asArray = {
      agent: { agent: { manager: [{ endpoint: 'manager.example.com:1514' }] } },
    };
    expect(field.agentExtract!(asObject)).toBe('manager.example.com:1514');
    expect(field.agentExtract!(asArray)).toBe('manager.example.com:1514');
  });

  it('resolves active-response fields from execd.active-response', () => {
    const field = findField('active-response-agent.ca_verification');
    const content = {
      execd: { 'active-response': { ca_verification: 'yes' } },
    };
    expect(get(content, field.agentPath!)).toBe('yes');
  });

  it('resolves inventory fields from syscollector, including a scan-settings field', () => {
    const disabled = findField('inventory.disabled');
    const hardware = findField('inventory.scan.hardware');
    const content = { syscollector: { disabled: 'no', hardware: 'yes' } };
    expect(disabled.render!(get(content, disabled.agentPath!))).toBe('enabled');
    expect(get(content, hardware.agentPath!)).toBe('yes');
  });

  it('resolves integrity-monitoring fixed tabs from fim.syscheck', () => {
    const general = findField('integrity-monitoring.general.frequency');
    const sync = findField('integrity-monitoring.synchronization.max_eps');
    const fileLimit = findField('integrity-monitoring.file-limit.entries');
    const registryLimit = findField(
      'integrity-monitoring.registry-limit.entries',
    );
    const whoData = findField('integrity-monitoring.who-data.provider');
    const content = {
      fim: {
        syscheck: {
          frequency: 43200,
          synchronization: { max_eps: 10 },
          file_limit: { entries: 100000 },
          registry_limit: { entries: 100000 },
          whodata: { provider: 'ebpf' },
        },
      },
    };
    expect(get(content, general.agentPath!)).toBe(43200);
    expect(get(content, sync.agentPath!)).toBe(10);
    expect(get(content, fileLimit.agentPath!)).toBe(100000);
    expect(get(content, registryLimit.agentPath!)).toBe(100000);
    expect(get(content, whoData.agentPath!)).toBe('ebpf');
  });

  it('excludes the manager-only integrity-monitoring General fields', () => {
    expect(
      searchableSettingsRegistry.find(
        f => f.id === 'integrity-monitoring.general.auto_ignore',
      ),
    ).toBeUndefined();
    expect(
      searchableSettingsRegistry.find(
        f => f.id === 'integrity-monitoring.general.alert_new_files',
      ),
    ).toBeUndefined();
  });

  it('resolves the integrity-monitoring nodiff list from fim.syscheck.nodiff', () => {
    const list = searchableSettingsRegistry.find(
      f => f.id === 'integrity-monitoring.nodiff',
    );
    if (!list || list.kind !== 'list') {
      throw new Error('Missing or wrong-kind: integrity-monitoring.nodiff');
    }
    const content = {
      fim: { syscheck: { nodiff: ['/etc/passwd', '/etc/hosts'] } },
    };
    const items = get(content, list.agentPath!) as string[];
    expect(items).toEqual(['/etc/passwd', '/etc/hosts']);
    expect(list.itemLabel(items[0], 0)).toBe('/etc/passwd');
    expect(list.itemFields).toEqual([{ field: '', label: 'Path' }]);
  });

  it('unwraps vulnerabilities.enabled out of the wmodules array', () => {
    const field = findField('vulnerabilities.enabled');
    const raw = {
      wmodules: [
        { 'vulnerability-detection': { enabled: 'yes' } },
        { 'aws-s3': {} },
      ],
    };
    const base = field.manager!.unwrap!(raw);
    expect(get(base, field.manager!.path)).toBe('yes');
  });

  it('returns undefined from the wmodules unwrap when the wodle is not configured', () => {
    const field = findField('vulnerabilities.enabled');
    const raw = { wmodules: [{ 'aws-s3': {} }] };
    expect(field.manager!.unwrap!(raw)).toBeUndefined();
  });

  describe('configurationHeaders', () => {
    it("gives registration-service's Main settings a description and help, and its SSL settings a description but no help", () => {
      const main =
        configurationHeaders[
          configurationHeaderKey('registration-service', 'Main settings')
        ];
      expect(main.title).toBe('Main settings');
      expect(main.description).toEqual(expect.any(String));
      expect(main.help!.length).toBeGreaterThan(0);

      const ssl =
        configurationHeaders[
          configurationHeaderKey('registration-service', 'SSL settings')
        ];
      expect(ssl.title).toBe('SSL settings');
      expect(ssl.description).toEqual(expect.any(String));
      expect(ssl.help).toBeUndefined();
    });

    it("splits global-configuration's Global tab into two differently-titled, differently-helped groups", () => {
      const logging =
        configurationHeaders[
          configurationHeaderKey('global-configuration', 'Global', 'logging')
        ];
      const agents =
        configurationHeaders[
          configurationHeaderKey('global-configuration', 'Global', 'agents')
        ];
      expect(logging.title).toBe('Logging settings');
      expect(agents.title).toBe('Agents settings');
      expect(logging.title).not.toBe(agents.title);
      expect(logging.help).not.toEqual(agents.help);
    });
  });

  it("gives log-collection's Sockets list its own distinct help, not the other tabs' shared set", () => {
    const findList = (id: string) => {
      const entry = searchableSettingsRegistry.find(f => f.id === id);
      if (!entry || entry.kind !== 'list') {
        throw new Error(`Missing registry list: ${id}`);
      }
      return entry;
    };
    const sockets = findList('log-collection.sockets');
    const logs = findList('log-collection.logs');
    const windowsEvents = findList('log-collection.windows-events');
    expect(sockets.help).toBeDefined();
    expect(logs.help).toBeDefined();
    expect(sockets.help).not.toEqual(logs.help);
    expect(logs.help).toEqual(windowsEvents.help);
  });

  it('carries the 5 restored per-field info tooltips', () => {
    const registrationInfoFields = [
      'registration-service.force.after_registration_time',
      'registration-service.force.key_mismatch',
      'registration-service.force.disconnected_time.enabled',
      'registration-service.force.disconnected_time.value',
    ];
    for (const id of registrationInfoFields) {
      expect(findField(id).info).toEqual(expect.any(String));
    }

    const journald = searchableSettingsRegistry.find(
      f => f.id === 'log-collection.journald',
    );
    if (!journald || journald.kind !== 'list') {
      throw new Error('Missing registry list: log-collection.journald');
    }
    const filtersField = journald.itemFields.find(f => f.field === 'filters');
    expect(filtersField?.info).toEqual(expect.any(String));
  });
});
