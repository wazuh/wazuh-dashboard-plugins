import { ApiAvailableUpdates, UserPreferencesDimissedUpdate } from '../../common/types';

export const areThereNewUpdates = (
  apisAvailableUpdates?: ApiAvailableUpdates[],
  lastDismissedUpdates?: UserPreferencesDimissedUpdate[]
) => {
  const notifyUser = !!apisAvailableUpdates?.find((apiAvailableUpdates) => {
    const {
      api_id,
      last_available_major,
      last_available_minor,
      last_available_patch,
    } = apiAvailableUpdates;

    const apiDismissed = lastDismissedUpdates?.find(
      (lastDismissedUpdate) => lastDismissedUpdate.api_id === api_id
    );

    if (
      !apiDismissed &&
      (last_available_major?.tag || last_available_minor?.tag || last_available_patch?.tag)
    ) {
      return true;
    }

    const isNewMajor =
      last_available_major?.tag && last_available_major.tag !== apiDismissed?.last_major;
    const isNewMinor =
      last_available_minor?.tag && last_available_minor.tag !== apiDismissed?.last_minor;
    const isNewPatch =
      last_available_patch?.tag && last_available_patch.tag !== apiDismissed?.last_patch;

    return isNewMajor || isNewMinor || isNewPatch;
  });

  return notifyUser;
};
