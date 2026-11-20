import { WzRequest } from '../../../../react-services/wz-request';

// Keeps each request URL under the usual server limits
const MAX_IDS_LENGTH = 8100;

export const chunkIds = (ids: string[], maxLength = MAX_IDS_LENGTH) =>
  ids.reduce<string[]>(
    (chunks, id) => {
      const last = chunks[chunks.length - 1];
      if (last.length >= maxLength) {
        chunks.push(id);
      } else {
        chunks[chunks.length - 1] = last ? `${last},${id}` : id;
      }
      return chunks;
    },
    [''],
  );

/**
 * Gets the MITRE ATT&CK items of a resource (groups, mitigations, software, tactics…) by their
 * ids, without loading the whole collection.
 */
export const getMitreResourcesByIds = async <T = Record<string, unknown>>(
  resource: string,
  ids: string[],
): Promise<T[]> => {
  if (!ids.length) {
    return [];
  }
  const idsParam = `${resource.replace(/s\s*$/, '')}_ids`;
  const responses = await Promise.all(
    chunkIds(ids).map(chunk =>
      WzRequest.apiReq('GET', `/mitre/${resource}?${idsParam}=${chunk}`, {}),
    ),
  );
  return responses.flatMap(
    response => response?.data?.data?.affected_items || [],
  );
};
