import {
  API_UPDATES_STATUS,
  AvailableUpdates,
  UserPreferencesDimissedUpdate,
} from '../../common/types';
import { areThereNewUpdates } from './are-there-new-updates';

const mockPatch = {
  description:
    '## Manager\r\n\r\n### Fixed\r\n\r\n- Fixed a crash when overwrite rules are triggered...',
  published_date: '2022-05-18T10:12:43Z',
  semver: { major: 4, minor: 3, patch: 8 },
  tag: 'v4.3.8',
  title: 'Wazuh v4.3.8',
};

const mockAvailableUpdates: AvailableUpdates = {
  current_version: 'v4.3.1',
  status: API_UPDATES_STATUS.AVAILABLE_UPDATES,
  last_check_date_dashboard: new Date('2023-09-30T14:00:00.000Z'),
  last_available_patch: mockPatch,
};

describe('areThereNewUpdates function', () => {
  it('should return true when there are updates and no dismissed record', () => {
    const result = areThereNewUpdates(mockAvailableUpdates, undefined);
    expect(result).toBe(true);
  });

  it('should return false when the current patch is already dismissed', () => {
    const lastDismissedUpdate: UserPreferencesDimissedUpdate = {
      last_patch: 'v4.3.8',
    };
    const result = areThereNewUpdates(mockAvailableUpdates, lastDismissedUpdate);
    expect(result).toBe(false);
  });

  it('should return true when a newer patch is available than what was dismissed', () => {
    const lastDismissedUpdate: UserPreferencesDimissedUpdate = {
      last_patch: 'v4.3.7',
    };
    const result = areThereNewUpdates(mockAvailableUpdates, lastDismissedUpdate);
    expect(result).toBe(true);
  });

  it('should return false when no updates are available', () => {
    const noUpdates: AvailableUpdates = {
      current_version: 'v4.3.8',
      status: API_UPDATES_STATUS.UP_TO_DATE,
      last_check_date_dashboard: new Date('2023-09-30T14:00:00.000Z'),
    };
    const result = areThereNewUpdates(noUpdates, undefined);
    expect(result).toBe(false);
  });
});
