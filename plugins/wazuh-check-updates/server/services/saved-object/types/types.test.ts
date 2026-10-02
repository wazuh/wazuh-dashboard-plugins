import {
  SAVED_OBJECT_UPDATES,
  SAVED_OBJECT_USER_PREFERENCES,
} from '../../../../common/constants';
import { availableUpdatesObject, userPreferencesObject } from '.';

describe('wazuh-check-updates saved object types', () => {
  test.each([
    [SAVED_OBJECT_UPDATES, availableUpdatesObject],
    [SAVED_OBJECT_USER_PREFERENCES, userPreferencesObject],
  ])('%s should be hidden from the generic saved objects API', (name, type) => {
    expect(type.name).toBe(name);
    expect(type.hidden).toBe(true);
    expect(type.namespaceType).toBe('agnostic');
  });
});
