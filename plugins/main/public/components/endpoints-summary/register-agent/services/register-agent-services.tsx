import { UseFormReturn } from '../../../../components/common/form/types';
import { WzRequest } from '../../../../react-services/wz-request';
import {
  tOperatingSystem,
  tOptionalParameters,
} from '../core/config/os-commands-definitions';
import { RegisterAgentData } from '../interfaces/types';
import { composeAgentEndpoint } from '../../../../../common/services/agent-endpoint';

type RemoteItem = {
  connection: 'syslog' | 'secure';
  ipv6: 'yes' | 'no';
  allowed_ips?: string[];
  queue_size?: string;
};

type RemoteConfig = {
  name: string;
  haveSecureConnection: boolean | null;
};

export type ServerAddressOptions = {
  label: string;
  value: string;
  nodetype: string;
};

/**
 * Get the remote configuration from api
 */
async function getRemoteConfiguration(nodeName: string): Promise<RemoteConfig> {
  let config: RemoteConfig = {
    name: nodeName,
    haveSecureConnection: false,
  };

  try {
    const result = await WzRequest.apiReq(
      'GET',
      `/cluster/${nodeName}/configuration/request/remote`,
      {},
    );
    const items = result?.data?.data?.affected_items || [];
    const remote = items[0]?.remote;
    if (remote) {
      const remoteFiltered = remote.filter((item: RemoteItem) => {
        return item.connection === 'secure';
      });

      remoteFiltered.length > 0
        ? (config.haveSecureConnection = true)
        : (config.haveSecureConnection = false);
    }
    return config;
  } catch (error) {
    return config;
  }
}
/**
 * Get the cluster auth configuration from Wazuh API
 * @param node
 * @returns
 */
async function getAuthConfiguration(node: string) {
  const authConfigUrl = `/cluster/${node}/configuration/auth/auth`;
  const result = await WzRequest.apiReq('GET', authConfigUrl, {});
  const auth = result?.data?.data?.affected_items?.[0];
  return auth;
}

/**
 * Get the connection configuration from the nodes registered in the cluster
 * @param nodeSelected
 * @param defaultServerAddress
 */
async function getConnectionConfig(
  nodeSelected: ServerAddressOptions,
  defaultServerAddress?: string,
) {
  const nodeName = nodeSelected?.label;
  const nodeIp = nodeSelected?.value;
  if (!defaultServerAddress) {
    if (nodeSelected.nodetype !== 'custom') {
      const remoteConfig = await getRemoteConfiguration(nodeName);
      return {
        serverAddress: nodeIp,
        connectionSecure: remoteConfig.haveSecureConnection,
      };
    } else {
      return {
        serverAddress: nodeName,
        connectionSecure: true,
      };
    }
  } else {
    return {
      serverAddress: defaultServerAddress,
      connectionSecure: true,
    };
  }
}

type NodeItem = {
  name: string;
  ip: string;
  type: string;
};

type NodeResponse = {
  data: {
    data: {
      affected_items: NodeItem[];
    };
  };
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
export const parseNodesInOptions = (
  nodes: NodeResponse,
): ServerAddressOptions[] => {
  return nodes.data.data.affected_items.map((item: NodeItem) => ({
    label: item.name,
    value: item.ip,
    nodetype: item.type,
  }));
};

/**
 * Get the list of the cluster nodes from API and parse it into a list of options
 */
export const fetchClusterNodesOptions = async (): Promise<
  ServerAddressOptions[]
> => {
  const nodes = await getNodeIPs();
  return parseNodesInOptions(nodes);
};

/**
 * Get the master node data from the list of cluster nodes
 * @param nodeIps
 */
export const getMasterNode = (
  nodeIps: ServerAddressOptions[],
): ServerAddressOptions[] => {
  return nodeIps.filter(nodeIp => nodeIp.nodetype === 'master');
};

/**
 * Get the remote and the auth configuration from the cluster master node
 * This function get the config from cluster mode
 */
export const getMasterConfiguration = async () => {
  const nodes = await fetchClusterNodesOptions();
  const masterNode = getMasterNode(nodes);
  const remote = await getRemoteConfiguration(masterNode[0].label);
  const auth = await getAuthConfiguration(masterNode[0].label);
  return {
    remote,
    auth,
  };
};

export { getConnectionConfig, getRemoteConfiguration };

export const getGroups = async () => {
  const result = await WzRequest.apiReq('GET', '/groups', {});
  return result.data.data.affected_items.map(item => ({
    label: item.name,
    id: item.name,
  }));
};

export const getRegisterAgentFormValues = (form: UseFormReturn) => {
  // return the values form the formFields and the value property
  return Object.keys(form.fields).map(key => {
    return {
      name: key,
      value: form.fields[key].value,
    };
  });
};

const ENDPOINT_FIELDS = ['serverAddress', 'serverPort', 'serverPath'];

export interface IParseRegisterFormValues {
  operatingSystem: {
    name: tOperatingSystem['name'] | '';
    architecture: tOperatingSystem['architecture'] | '';
  };
  // optionalParams is an object that their key is defined in tOptionalParameters and value must be string
  optionalParams: {
    [FIELD in tOptionalParameters]: any;
  };
}

export const parseRegisterAgentFormValues = (
  formValues: { name: keyof UseFormReturn['fields']; value: any }[],
  OSOptionsDefined: RegisterAgentData[],
  initialValues?: IParseRegisterFormValues,
) => {
  // return the values form the formFields and the value property
  const parsedForm =
    initialValues ||
    ({
      operatingSystem: {
        architecture: '',
        name: '',
      },
      optionalParams: {},
    } as IParseRegisterFormValues);
  /* The wizard asks for the endpoint's address, port and path prefix apart so
  each keeps its own validation, but the agent is installed with one value, so
  they are joined back here. */
  const endpointComponents: Record<string, string> = {};

  formValues.forEach(field => {
    if (ENDPOINT_FIELDS.includes(field.name as string)) {
      endpointComponents[field.name as string] = field.value;
    } else if (field.name === 'operatingSystemSelection') {
      // search the architecture defined in architecture array and get the os name defined in title array in the same index
      const operatingSystem = OSOptionsDefined.find(os =>
        os.architecture.includes(field.value),
      );
      if (operatingSystem) {
        parsedForm.operatingSystem = {
          name: operatingSystem.title,
          architecture: field.value,
        };
      }
    } else {
      if (field.name === 'agentGroups') {
        parsedForm.optionalParams[field.name as any] = field.value.map(
          item => item.id,
        );
      } else {
        parsedForm.optionalParams[field.name as any] = field.value;
      }
    }
  });

  parsedForm.optionalParams.serverAddress = composeAgentEndpoint({
    address: endpointComponents.serverAddress,
    port: endpointComponents.serverPort,
    path: endpointComponents.serverPath,
  });

  return parsedForm;
};
