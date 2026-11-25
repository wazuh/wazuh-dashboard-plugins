import { PLUGIN_SETTINGS } from './constants';
import { getUiSettingsDefinitions } from './settings-adapter';

describe('getUiSettingsDefinitions', () => {
  const uiSettings = getUiSettingsDefinitions(PLUGIN_SETTINGS);

  it.each`
    key                        | category
    ${'enrollment.dns'}        | ${'server management'}
    ${'enrollment.port'}       | ${'server management'}
    ${'enrollment.path'}       | ${'server management'}
    ${'timeout'}               | ${'server management'}
    ${'reports.csv.maxRows'}   | ${'reporting'}
    ${'check_updates.enabled'} | ${'general'}
  `('groups $key under $category', ({ key, category }) => {
    expect(uiSettings[key].category).toEqual([category]);
  });

  it('registers only the settings above', () => {
    expect(Object.keys(uiSettings).sort()).toEqual(
      [
        'check_updates.enabled',
        'enrollment.dns',
        'enrollment.path',
        'enrollment.port',
        'reports.csv.maxRows',
        'timeout',
      ].sort(),
    );
  });
});
