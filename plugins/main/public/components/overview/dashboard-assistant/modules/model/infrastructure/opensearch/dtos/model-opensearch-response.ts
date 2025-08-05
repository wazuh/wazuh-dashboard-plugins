export interface ModelOpenSearchResponse {
  name: string;
  algorithm: string; // e.g., 'REMOTE'
  model_group_id: string;
  connector_id: string;
  description: string;
  model_version: `${number}`;
  model_state: string;
  created_time: number;
  last_deployed_time: number;
  deploy_to_all_nodes: boolean;
  is_hidden: boolean;
  planning_worker_node_count: number;
  auto_redeploy_retry_times: number;
  last_updated_time: number;
  current_worker_node_count: number;
  planning_worker_nodes: string[];
}
