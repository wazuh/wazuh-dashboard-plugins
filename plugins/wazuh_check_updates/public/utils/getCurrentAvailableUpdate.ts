import { AvailableUpdates } from '../../common/types';

export const getCurrentAvailableUpdate = (availableUpdates: AvailableUpdates) => {
  const { patch, minor, mayor } = availableUpdates;

  if (patch?.length) return patch[patch.length - 1];
  if (minor?.length) return minor[minor.length - 1];
  if (mayor?.length) return mayor[mayor.length - 1];
  return undefined;
};
