import { WzRequest } from '../../../react-services';
import { ServerAddressOptions } from './steps/server-address';

type NodeItem = {
  name: string;
  ip: string;
  type: string;
}

type NodeResponse = {
  data: {
    data: {
      affected_items: NodeItem[];
    }
  }
}

/**
 * Get the list of the cluster nodes and parse it into a list of options
 */
export const getNodeIPs = async (): Promise<any> => {
  return await WzRequest.apiReq('GET', '/cluster/nodes', {});
};

/**
 * Parse the nodes list from the API response to a format that can be used by the EuiComboBox
 * @param nodes
 */
export const parseNodesInOptions = (nodes: NodeResponse): ServerAddressOptions[] => {
  return nodes.data.data.affected_items.map((item: NodeItem) => ({
    label: item.name,
    value: item.ip,
    nodetype: item.type,
  }));
};

/**
 * Get the list of the cluster nodes from API and parse it into a list of options
 */
export const fetchClusterNodesOptions = async (): Promise<ServerAddressOptions[]> => {
  const nodes = await getNodeIPs();
  return parseNodesInOptions(nodes);
}

/**
 * Get the master node data from the list of cluster nodes
 * @param nodeIps
 */
export const getMasterNode = (nodeIps: ServerAddressOptions[]): ServerAddressOptions[] => {
  return nodeIps.filter((nodeIp) => nodeIp.nodetype === 'master');
};
