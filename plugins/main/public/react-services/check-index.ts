import { SavedObject } from '.';
import { getSavedObjects } from '../kibana-services';
import { NOT_TIME_FIELD_NAME_INDEX_PATTERN } from '../../common/constants';

export async function existsIndices(indexPatternId: string) {
  try {
    const fields = await SavedObject.getIndicesFields(indexPatternId);
    return { exist: true, fields };
  } catch (error) {
    return { exist: false };
  }
}

export async function existsIndexPattern(indexPatternID: string) {
  return await getSavedObjects().client.get('index-pattern', indexPatternID);
}

export async function createIndexPattern(
  indexPattern: string,
  fields: any,
  extraAttributes: any = {},
) {
  try {
    await SavedObject.createSavedObject(
      'index-pattern',
      indexPattern,
      {
        attributes: {
          ...(extraAttributes ?? {}),
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
