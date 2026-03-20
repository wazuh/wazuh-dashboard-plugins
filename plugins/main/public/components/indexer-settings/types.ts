export type IndexerSettings = {
  engine: Record<string, unknown> & {
    index_raw_events: boolean;
  };
};

export type Engine = IndexerSettings['engine'];
