import { PLUGIN_SETTINGS } from './constants';

describe('[settings] Update check', () => {
  it('is a switch named by its effect, off by default', () => {
    const setting = PLUGIN_SETTINGS['wazuh.updates.enabled'];

    expect(setting.title).toBe('Check for updates');
    expect(setting.defaultValue).toBe(false);
    expect(setting.validate(true)).toBeUndefined();
    expect(setting.validate('yes')).toBeDefined();
  });

  it('no longer defines the inverted key', () => {
    expect(PLUGIN_SETTINGS['wazuh.updates.disabled']).toBeUndefined();
  });
});
