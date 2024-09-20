import { SavedObject } from '.';
import { getSavedObjects } from '../kibana-services';
import { NOT_TIME_FIELD_NAME_INDEX_PATTERN } from '../../common/constants';

export async function verifyExistenceIndices(indexPatternId: string) {
  try {
    const fields = await SavedObject.getIndicesFields(indexPatternId);
    return { exist: true, fields };
  } catch (error) {
    return { exist: false };
  }
}

export async function verifyExistenceIndexPattern(indexPatternID: string) {
  return await getSavedObjects().client.get('index-pattern', indexPatternID);
}

export async function createIndexPattern(indexPattern, fields: any) {
  try {
    await SavedObject.createSavedObject(
      'index-pattern',
      indexPattern,
      {
        attributes: {
          title: indexPattern,
          timeFieldName: NOT_TIME_FIELD_NAME_INDEX_PATTERN,
        },
      },
      fields,
    );
    await SavedObject.validateIndexPatternSavedObjectCanBeFound([indexPattern]);
  } catch (error) {
    return { error: error.message };
  }
}
