import { WzRequest } from '../../../react-services';
import { ServerAddressOptions } from './steps/server-address';

/**
 * Get a list of nodes and parsed into a string separated by semicolon
 * @param selectedNodes
 */
export const parseNodeIPs = (selectedNodes: any): string => {
  let allNodeIps = '';
  if (selectedNodes.length > 1) {
    allNodeIps = selectedNodes.map((o) => o.value).join(';');
  } else if (selectedNodes.length === 1) {
    allNodeIps = selectedNodes[0].value;
  }
  return allNodeIps;
};

/**
 * Get the list of the cluster nodes and parse it into a list of options
 */
export const getNodeIPs = async (): Promise<ServerAddressOptions[]> => {
  const result = await WzRequest.apiReq('GET', '/cluster/nodes', {});
  return result.data.data.affected_items.map((item) => ({
    label: item.name,
    value: item.ip,
    nodeType: item.type,
  }));
};

/**
 * Get the master node data from the list of cluster nodes
 * @param nodeIps
 */
export const getMasterNode = (nodeIps: ServerAddressOptions[]): ServerAddressOptions[] => {
  return nodeIps.filter((nodeIp) => nodeIp.nodeType === 'master');
};
