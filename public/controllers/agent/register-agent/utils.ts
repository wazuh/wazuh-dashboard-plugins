import { WzRequest } from '../../../react-services';

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
 * Get current nodes data from cluster
 */
export const getNodeIPs = async () => {
  const result = await WzRequest.apiReq('GET', '/cluster/nodes', {});
  return result.data.data.affected_items.map((item) => ({ label: `${item.name}: ${item.ip}`, value: item.ip }));
};
