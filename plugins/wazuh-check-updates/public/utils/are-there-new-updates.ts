import { ApiAvailableUpdates, UserPreferencesDimissedUpdate } from '../../common/types';

export const areThereNewUpdates = (
  apisAvailableUpdates?: ApiAvailableUpdates[],
  lastDismissedUpdates?: UserPreferencesDimissedUpdate[]
) => {
  const notifyUser = !!apisAvailableUpdates?.find((apiAvailableUpdates) => {
    const { apiId, lastMayor, lastMinor, lastPatch } = apiAvailableUpdates;

    const apiDismissed = lastDismissedUpdates?.find(
      (lastDismissedUpdate) => lastDismissedUpdate.apiId === apiId
    );

    if (!apiDismissed && (lastMayor?.tag || lastMinor?.tag || lastPatch?.tag)) {
      return true;
    }

    const isNewMajor = lastMayor?.tag && lastMayor.tag !== apiDismissed?.mayor;
    const isNewMinor = lastMinor?.tag && lastMinor.tag !== apiDismissed?.minor;
    const isNewPatch = lastPatch?.tag && lastPatch.tag !== apiDismissed?.patch;

    return isNewMajor || isNewMinor || isNewPatch;
  });

  return notifyUser;
};
