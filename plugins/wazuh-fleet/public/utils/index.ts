/**
 * The function `buildSubAppId` takes a parent app ID and a sub app ID, and
 * returns a combined ID with the sub app ID URL-encoded.
 * @param {string} parentAppId - The `parentAppId` parameter is a string
 * representing the ID of the parent application.
 * @param {string} subAppId - The `subAppId` parameter is a string representing the
 * ID of a sub-application within a parent application.
 */
export function buildSubAppId(parentAppId: string, subAppId: string) {
  return `${parentAppId}_${encodeURIComponent(`/${subAppId}`)}`;
}
