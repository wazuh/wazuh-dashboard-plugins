/** A single consumer document from the `.wazuh-cti-consumers` internal index. */
export interface CtiConsumer {
  name: string;
  context: string;
  type: string;
  resource: string;
  is_public: boolean;
  status: string;
  local_offset: number;
  remote_offset: number;
  /**
   * ISO 8601 time of the last content update, scheduled or manual. Missing on
   * indexers that do not report it yet.
   */
  updated_at?: string;
  /**
   * Steps of the last sync that failed and are retried on the next one, even
   * when the feed is `ready` (e.g. `rules`, `detectors`). Empty when every step
   * is in sync; missing on indexers that do not report it yet.
   */
  pending_sync_phases?: string[];
}

export interface CtiConsumersResponse {
  data: CtiConsumer[];
  /**
   * ISO 8601 time the indexer last checked Wazuh CTI for new content, from the
   * index's global document. Missing on indexers that do not report it yet.
   */
  last_checked_at?: string;
}
