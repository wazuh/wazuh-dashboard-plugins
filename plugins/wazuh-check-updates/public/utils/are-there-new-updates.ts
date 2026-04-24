import {
  AvailableUpdates,
  UserPreferencesDimissedUpdate,
} from '../../common/types';

export const areThereNewUpdates = (
  availableUpdates?: AvailableUpdates,
  lastDismissedUpdate?: UserPreferencesDimissedUpdate,
): boolean => {
  const { last_available_major, last_available_minor, last_available_patch } =
    availableUpdates ?? {};

  if (
    !lastDismissedUpdate &&
    (last_available_major?.tag ||
      last_available_minor?.tag ||
      last_available_patch?.tag)
  ) {
    return true;
  }

  const isNewMajor =
    last_available_major?.tag &&
    last_available_major.tag !== lastDismissedUpdate?.last_major;
  const isNewMinor =
    last_available_minor?.tag &&
    last_available_minor.tag !== lastDismissedUpdate?.last_minor;
  const isNewPatch =
    last_available_patch?.tag &&
    last_available_patch.tag !== lastDismissedUpdate?.last_patch;

  return !!(isNewMajor || isNewMinor || isNewPatch);
};
