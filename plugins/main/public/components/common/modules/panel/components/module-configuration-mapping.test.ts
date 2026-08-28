/* eslint-disable camelcase -- the fixtures reproduce the index and
Server API field names verbatim. */
import {
  mapModuleContentToRenderProperties,
  toApiAuthEntries,
} from './module-configuration-mapping';

describe('mapModuleContentToRenderProperties', () => {
  it('returns entity, name and configuration when the module key exists', () => {
    const content = { office365: { enabled: 'yes' } };

    expect(
      mapModuleContentToRenderProperties(
        content,
        'office365',
        'Agent',
        'agent-1',
      ),
    ).toEqual({
      entity: 'Agent',
      name: 'agent-1',
      configuration: { enabled: 'yes' },
    });
  });

  it('returns null when the module key is absent', () => {
    const content = { fim: {} };

    expect(
      mapModuleContentToRenderProperties(content, 'office365', 'Agent'),
    ).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(
      mapModuleContentToRenderProperties({}, 'office365', 'Agent'),
    ).toBeNull();
  });

  it('returns null for undefined content', () => {
    expect(
      mapModuleContentToRenderProperties(undefined, 'office365', 'Agent'),
    ).toBeNull();
  });

  it('returns null for null content', () => {
    expect(
      mapModuleContentToRenderProperties(null, 'office365', 'Agent'),
    ).toBeNull();
  });

  it('returns null when only content.wmodules is present', () => {
    const content = {
      wmodules: {
        internal_options: {
          'wazuh_modules.debug': 2,
          task_nice: 0,
          max_eps: 0,
          kill_timeout: 0,
        },
      },
    };

    expect(
      mapModuleContentToRenderProperties(content, 'office365', 'Agent'),
    ).toBeNull();
    expect(
      mapModuleContentToRenderProperties(content, 'github', 'Agent'),
    ).toBeNull();
  });
});

describe('toApiAuthEntries', () => {
  it('passes through an array', () => {
    const value = [{ tenant_id: 't-1' }, { tenant_id: 't-2' }];

    expect(toApiAuthEntries(value)).toEqual(value);
  });

  it('wraps a non-array object into a single entry', () => {
    const value = { tenant_id: 't-1' };

    expect(toApiAuthEntries(value)).toEqual([value]);
  });

  it('returns an empty array for undefined', () => {
    expect(toApiAuthEntries(undefined)).toEqual([]);
  });

  it('returns an empty array for a string', () => {
    expect(toApiAuthEntries('not-a-valid-value')).toEqual([]);
  });

  it('returns an empty array for a number', () => {
    expect(toApiAuthEntries(42)).toEqual([]);
  });

  it('filters out non-object items from an array', () => {
    const value = [{ tenant_id: 't-1' }, 'invalid', 42, null];

    expect(toApiAuthEntries(value)).toEqual([{ tenant_id: 't-1' }]);
  });
});
