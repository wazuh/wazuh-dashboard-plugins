import { getDataPlugin } from '../../../../kibana-services';
import { WAZUH_FINDINGS_PATTERN } from '../../../../../common/constants';

export async function resolveOriginalFinding(
  hit: any,
): Promise<{ document: any; indexPattern: any } | null> {
  const docId = hit?._source?.event?.doc_id;
  if (!docId) return null;

  try {
    const indexPattern = await getDataPlugin().indexPatterns.get(
      WAZUH_FINDINGS_PATTERN,
    );
    const searchSource = await getDataPlugin().search.searchSource.create();
    const result = await searchSource
      .setParent(undefined)
      .setField('index', indexPattern)
      .setField('size', 1)
      .setField('query', {
        language: 'lucene',
        query: { ids: { values: [docId] } },
      })
      .fetch();

    const document = result?.hits?.hits?.[0];
    return document ? { document, indexPattern } : null;
  } catch {
    return null;
  }
}
