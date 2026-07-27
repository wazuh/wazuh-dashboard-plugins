/**
 * Shared paged-fetch loop used by SettingsService.list and ConversationsService.list: loops
 * pages of a server-truncated list endpoint until every page has been collected, or a hard
 * ceiling of `maxPages` is hit — whichever comes first — to guard against an unbounded loop if
 * the server ever reports a bogus `total`.
 *
 * `pageSize` is the per-page size the caller requests from the server; a page that comes back
 * shorter than it means no more data regardless of what `total` claims (exactly the short-page
 * break both services used before this was extracted — including on the FIRST page, so the
 * behavior is identical to the pre-extraction loops for every response sequence).
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<{ items: T[]; total: number }>,
  pageSize: number,
  maxPages: number,
  truncationWarning: string,
): Promise<T[]> {
  const collected: T[] = [];
  let page = 1;
  let total = Infinity;

  while (collected.length < total && page <= maxPages) {
    // eslint-disable-next-line no-await-in-loop -- pages are fetched serially: each request depends on the running total
    const response = await fetchPage(page);
    collected.push(...response.items);
    total = response.total;

    if (response.items.length < pageSize) {
      // Short page: no more data, regardless of what `total` claims.
      break;
    }
    page += 1;
  }

  if (collected.length < total) {
    console.warn(truncationWarning);
  }

  return collected;
}
