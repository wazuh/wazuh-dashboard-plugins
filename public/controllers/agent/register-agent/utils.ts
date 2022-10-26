import { WzRequest } from '../../../react-services';
import { ServerAddressOptions } from './steps/server-address';

/**
 * Get a list of nodes and parsed into a string separated by semicolon
 * @param selectedNodes
 * @param osSelected
 */
export const parseNodeIPs = (selectedNodes: any, osSelected: string): string => {
  const delimiter = osSelected === 'win' ? ';' : ','; // by default any another OS use comma as delimiter, to prevent add every OS here
  let allNodeIps = '';
  if (selectedNodes.length > 1) {
    allNodeIps = selectedNodes.map((o) => o.value).join(delimiter);
  } else if (selectedNodes.length === 1) {
    allNodeIps = selectedNodes[0].value;
  }
  return allNodeIps;
};

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
export const parseNodesInOptions = (nodes: any): ServerAddressOptions[] => {
  return nodes.data.data.affected_items.map((item) => ({
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
