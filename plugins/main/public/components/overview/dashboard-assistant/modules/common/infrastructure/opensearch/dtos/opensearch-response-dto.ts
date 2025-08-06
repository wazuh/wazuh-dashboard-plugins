export interface OpenSearchResponseDto<T> {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number | null;
    hits: Array<{
      _index: string;
      _id: string;
      _score: number | null;
      _source: T;
    }>;
  };
}
