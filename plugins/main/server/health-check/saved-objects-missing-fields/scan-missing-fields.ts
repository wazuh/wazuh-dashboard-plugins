import type { SavedObjectsClientContract } from 'opensearch_dashboards/server';
import type { MissingFieldsReport } from '../../../common/saved-objects-missing-fields';
import {
  findMissingFields,
  resolveSource,
  SavedObjectLike,
} from './find-missing-fields';

const SCANNED_TYPES = ['visualization', 'search'];
const PAGE_SIZE = 1000;

/** Every visualization and saved search, page by page. */
export async function findScannedObjects(
  savedObjectsClient: SavedObjectsClientContract,
): Promise<SavedObjectLike[]> {
  const objects: SavedObjectLike[] = [];

  for (let page = 1; ; page++) {
    // eslint-disable-next-line no-await-in-loop -- pages are read one after another
    const { saved_objects: batch, total } = await savedObjectsClient.find({
      type: SCANNED_TYPES,
      perPage: PAGE_SIZE,
      page,
    });
    objects.push(...(batch as SavedObjectLike[]));
    if (!batch.length || objects.length >= total) {
      return objects;
    }
  }
}

/** The visualizations and saved searches with these ids. Unknown ids are skipped. */
export async function getScannedObjects(
  savedObjectsClient: SavedObjectsClientContract,
  ids: string[],
): Promise<SavedObjectLike[]> {
  if (!ids.length) {
    return [];
  }
  const { saved_objects: objects } = await savedObjectsClient.bulkGet(
    ids.flatMap(id => SCANNED_TYPES.map(type => ({ id, type }))),
  );

  return (objects as (SavedObjectLike & { error?: unknown })[]).filter(
    ({ error }) => !error,
  );
}

async function getIndexPatternFields(
  savedObjectsClient: SavedObjectsClientContract,
  id: string,
): Promise<{ title: string; fields: Set<string> } | undefined> {
  let indexPattern: SavedObjectLike;
  try {
    indexPattern = await savedObjectsClient.get('index-pattern', id);
  } catch {
    // A missing index pattern already shows its own error in the panel.
    return undefined;
  }
  // Panels resolve fields from this stored list, not from the live mapping.
  let fields: { name: string }[];
  try {
    fields = JSON.parse(indexPattern.attributes.fields || '[]');
  } catch {
    return undefined;
  }
  // An empty list is filled the first time the index pattern loads: nothing to compare yet.
  if (!Array.isArray(fields) || !fields.length) {
    return undefined;
  }

  return {
    title: indexPattern.attributes.title ?? id,
    fields: new Set(fields.map(({ name }) => name)),
  };
}

/**
 * Reports the objects that use fields their index pattern does not have. Objects built
 * on a saved search are checked against the index pattern of that search.
 */
export async function scanMissingFields(
  objects: SavedObjectLike[],
  savedObjectsClient: SavedObjectsClientContract,
): Promise<MissingFieldsReport[]> {
  const savedSearches = new Map(
    objects.filter(({ type }) => type === 'search').map(so => [so.id, so]),
  );
  const linkedIds = objects
    .map(so => resolveSource(so).savedSearchId)
    .filter((id): id is string => Boolean(id) && !savedSearches.has(id!));
  (
    await getScannedObjects(savedObjectsClient, [...new Set(linkedIds)])
  ).forEach(so => savedSearches.set(so.id, so));

  const fieldsByIndexPattern = new Map<
    string,
    ReturnType<typeof getIndexPatternFields>
  >();
  const getFields = (id: string) => {
    if (!fieldsByIndexPattern.has(id)) {
      fieldsByIndexPattern.set(
        id,
        getIndexPatternFields(savedObjectsClient, id),
      );
    }
    return fieldsByIndexPattern.get(id)!;
  };

  const reports = await Promise.all(
    objects.map(async (so): Promise<MissingFieldsReport | undefined> => {
      const { indexPatternId, savedSearchId } = resolveSource(so);
      const sourceId =
        indexPatternId ??
        (savedSearchId && savedSearches.has(savedSearchId)
          ? resolveSource(savedSearches.get(savedSearchId)!).indexPatternId
          : undefined);
      // TSVB, Vega, Timeline and Markdown visualizations use no index pattern.
      if (!sourceId) {
        return undefined;
      }
      const indexPattern = await getFields(sourceId);
      if (!indexPattern) {
        return undefined;
      }
      const missing = findMissingFields(so, indexPattern.fields);

      return missing.length
        ? {
            id: so.id,
            type: so.type,
            title: so.attributes?.title ?? so.id,
            indexPatternId: sourceId,
            indexPatternTitle: indexPattern.title,
            missing,
          }
        : undefined;
    }),
  );

  return reports.filter((report): report is MissingFieldsReport =>
    Boolean(report),
  );
}
