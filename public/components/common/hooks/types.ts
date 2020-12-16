export type AgentsSummary = {
  total: number;
  active: number;
  disconnected: number;
  never_connected: number;
};
export type WzApiResponse =
  | {
      affected_items: { [key: string]: any }[];
      failed_items: { [key: string]: any }[];
      total_affected_items: number;
      total_failed_items: number;
    }
  | AgentsSummary;

export type AgentGroup = {
  totalSelectedAgents: [];
  failed_items: [];
  total_affected_items: number;
  total_failed_items: number;
};
