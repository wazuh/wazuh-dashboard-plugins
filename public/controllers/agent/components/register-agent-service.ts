import { WzRequest } from '../../../react-services/wz-request';

type Protocol = 'TCP' | 'UDP';

type RemoteItem = {
  connection: 'syslog' | 'secure';
  ipv6: 'yes' | 'no';
  protocol: Protocol[];
  allowed_ips?: string[];
  queue_size?: string;
};

type RemoteConfig = {
  name: string;
  protocols: Protocol[];
  haveConnectionSecure: boolean | null;
};

/**
 * Get the remote configuration from nodes registered in the cluster
 */
export const getRemoteConfiguration = async (
  nodeName: string,
): Promise<RemoteConfig> => {
  let config: RemoteConfig = {
    name: nodeName,
    protocols: [],
    haveConnectionSecure: null,
  };
  const result = await WzRequest.apiReq(
    'GET',
    `/cluster/${nodeName}/configuration/request/remote`,
    {},
  );
  const items = ((result.data || {}).data || {}).affected_items || [];
  const remote = items[0]?.remote;
  if (remote) {
    const remoteFiltered = remote.filter((item: RemoteItem) => {
      return item.connection === 'secure';
    });

    remoteFiltered.length > 0
      ? (config.haveConnectionSecure = true)
      : (config.haveConnectionSecure = false);

    remote.forEach((item: RemoteItem) => {
      // get all protocols available
      item.protocol.forEach(protocol => {
        if (!config.protocols.includes(protocol)) {
          config.protocols.push(protocol);
        }
      });
    });
  }
  return config;
};
