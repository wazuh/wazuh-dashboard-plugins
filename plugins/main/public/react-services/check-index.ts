import { SavedObject } from '.';

export async function checkExistenceIndices(indexPatternId: string) {
  try {
    const fields = await SavedObject.getIndicesFields(indexPatternId);
    return { exist: true, fields };
  } catch (error) {
    return { exist: false };
  }
}
