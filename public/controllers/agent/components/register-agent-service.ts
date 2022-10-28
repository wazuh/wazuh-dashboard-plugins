import { WzRequest } from '../../../react-services/wz-request';

type RemoteConfig = {
  udpProtocol: boolean | null;
  connectionSecure: boolean | null;
};

type RemoteItem = {
  connection: 'syslog' | 'secure';
  ipv6: 'yes' | 'no';
  protocol: 'TCP' | 'UDP'[];
};

export const getRemoteConfiguration = async (): Promise<RemoteConfig> => {
  let config: RemoteConfig = {
    udpProtocol: null,
    connectionSecure: null,
  };
  const result = await WzRequest.apiReq(
    'GET',
    '/agents/000/config/request/remote',
    {},
  );
  const remote = ((result.data || {}).data || {}).remote || {};
  const remoteFiltered = remote.filter((item: RemoteItem) => {
    return item.connection === 'secure';
  });
  if (remoteFiltered.length === 0) {
    config.connectionSecure = false;
  } else {
    remoteFiltered.forEach((item: RemoteItem) => {
      if (item.connection === 'secure') {
        if (item.protocol.length === 1 && item.protocol[0] == 'UDP') {
          config = {
            udpProtocol: true,
            connectionSecure: true,
          };
        }
        if (item.protocol.length > 1 && item.protocol[0] == 'TCP') {
          config = {
            udpProtocol: false,
            connectionSecure: true,
          };
        }
      }
    });
  }
  return config;
};
