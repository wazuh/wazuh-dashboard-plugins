import { AvailableUpdates } from '../../common/types';

export const getCurrentAvailableUpdate = (availableUpdates: Partial<AvailableUpdates> = {}) => {
  const { patch, minor, mayor } = availableUpdates;

  //TODO: Check real service to determinate the current update

  if (patch?.length) {
    return patch[patch.length - 1];
  }
  if (minor?.length) {
    return minor[minor.length - 1];
  }
  if (mayor?.length) {
    return mayor[mayor.length - 1];
  }
  return undefined;
};
