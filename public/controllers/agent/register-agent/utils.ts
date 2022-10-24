const mockedClusterNodes = {
  data: {
    data: {
      affected_items: [
        {
          name: 'master-node',
          type: 'master',
          version: '4.x',
          ip: 'wazuh-master',
        },
        {
          name: 'worker1',
          type: 'worker',
          version: '4.x',
          ip: '172.26.0.7',
        },
        {
          name: 'worker2',
          type: 'worker',
          version: '4.x',
          ip: '172.26.0.6',
        },
      ],
      total_affected_items: 3,
      total_failed_items: 0,
      failed_items: [],
    },
    message: 'All selected nodes information was returned',
    error: 0,
  },
};

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
  //const result = await WzRequest.apiReq('GET', '/cluster/nodes', {});
  const result = mockedClusterNodes;
  return result.data.data.affected_items.map((item) => ({ label: item.name, value: item.ip, nodeType: item.type }));
};