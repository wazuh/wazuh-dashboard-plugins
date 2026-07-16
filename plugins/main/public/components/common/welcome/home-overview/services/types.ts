/** Status of a single data group: distinguishes "dependency absent" (hide) from
 * "query failed" (error box). */
export type DataGroupStatus = 'loading' | 'available' | 'unavailable' | 'error';

export interface DataGroupResult<T> {
  status: DataGroupStatus;
  data?: T;
}

export type SeverityBand = 'critical' | 'high' | 'medium' | 'low';

export type SeverityCounts = Record<SeverityBand, number>;

export interface TopItem {
  key: string;
  count: number;
}

export interface AgentStatus {
  active: number;
  disconnected: number;
  pending: number;
  neverConnected: number;
  total: number;
}

export interface FindingsOverview {
  severity: SeverityCounts;
  topTactics: TopItem[];
}
