import { assistantSettingsSavedObjectType } from './assistant-settings';
import { ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE } from '../../common/constants';

describe('assistantSettingsSavedObjectType', () => {
  it('registers under the expected saved-object type name', () => {
    expect(assistantSettingsSavedObjectType.name).toBe(
      ASSISTANT_SETTINGS_SAVED_OBJECT_TYPE,
    );
  });

  it('is hidden from the generic Saved Objects management UI/API', () => {
    // Security-relevant: this singleton holds privacy/field-policy defaults and must stay
    // reachable only through this plugin's own routes, never the generic Saved Objects surface.
    expect(assistantSettingsSavedObjectType.hidden).toBe(true);
  });

  it('is namespace-scoped as a single (non-multi-tenant) object', () => {
    expect(assistantSettingsSavedObjectType.namespaceType).toBe('single');
  });

  it('maps opaque JSON bags (privacyDefaultPerProvider/fieldPolicy) as unindexed objects', () => {
    const { properties } = assistantSettingsSavedObjectType.mappings;
    expect(properties.privacyDefaultPerProvider).toEqual({
      type: 'object',
      enabled: false,
    });
    expect(properties.fieldPolicy).toEqual({ type: 'object', enabled: false });
  });

  it('maps scalar settings fields with their concrete types', () => {
    const { properties } = assistantSettingsSavedObjectType.mappings;
    expect(properties.privacyDefaultOn).toEqual({ type: 'boolean' });
    expect(properties.userCanOverride).toEqual({ type: 'boolean' });
    expect(properties.conversationRetentionDays).toEqual({ type: 'integer' });
  });
});
