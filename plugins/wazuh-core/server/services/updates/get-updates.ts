import { mockAvailableUpdates } from './mocks';
import { AvailableUpdates } from '../../../common/types';

export const getUpdates = async (): Promise<AvailableUpdates[]> => {
  return [mockAvailableUpdates];
};
