import {
  coreMock,
  savedObjectsRepositoryMock,
} from '../../../src/core/server/mocks';
import {
  SAVED_OBJECT_UPDATES,
  SAVED_OBJECT_USER_PREFERENCES,
} from '../common/constants';
import { setInternalSavedObjectsClient } from './plugin-services';
import { AppPluginStartDependencies } from './types';
import { WazuhCheckUpdatesPlugin } from './plugin';

jest.mock('./plugin-services');

describe('WazuhCheckUpdatesPlugin start', () => {
  test('should include the hidden saved object types in the internal repository', () => {
    const initializerContext = coreMock.createPluginInitializerContext();
    const coreStart = coreMock.createStart();
    const internalRepository = savedObjectsRepositoryMock.create();
    coreStart.savedObjects.createInternalRepository.mockReturnValue(
      internalRepository,
    );

    new WazuhCheckUpdatesPlugin(initializerContext).start(
      coreStart,
      {} as AppPluginStartDependencies,
    );

    expect(
      coreStart.savedObjects.createInternalRepository,
    ).toHaveBeenCalledWith([
      SAVED_OBJECT_UPDATES,
      SAVED_OBJECT_USER_PREFERENCES,
    ]);
    expect(setInternalSavedObjectsClient).toHaveBeenCalledWith(
      internalRepository,
    );
  });
});
