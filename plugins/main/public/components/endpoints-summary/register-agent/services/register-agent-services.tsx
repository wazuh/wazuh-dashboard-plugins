import { UseFormReturn } from '../../../../components/common/form/types';
import { WzRequest } from '../../../../react-services/wz-request';
import {
  tOperatingSystem,
  tOptionalParameters,
} from '../core/config/os-commands-definitions';
import { RegisterAgentData } from '../interfaces/types';
import { composeAgentEndpoint } from '../../../../../common/services/agent-endpoint';
import {
  ConfigurationBoolean,
  isConfigEnabled,
} from '../../../../../common/services/configuration-value';

export type ServerAddressOptions = {
  label: string;
  value: string;
  nodetype: string;
};

export type AuthConfiguration = {
  auth?: {
    use_password?: ConfigurationBoolean;
  };
  'authd.pass'?: string;
};

export interface RegistrationPassword {
  needsPassword: boolean;
  /** Empty when no password is needed, or when the caller cannot read it. */
  password: string;
}

/**
 * Get the cluster auth configuration from Wazuh API
 * @param node
 * @returns
 */
async function getAuthConfiguration(
  node: string,
): Promise<AuthConfiguration | undefined> {
  const authConfigUrl = `/cluster/${node}/configuration/auth/auth`;
  const result = await WzRequest.apiReq('GET', authConfigUrl, {});
  const auth = result?.data?.data?.affected_items?.[0];
  return auth;
}

/**
 * Whether the enrollment command has to carry a registration password, and
 * which one.
 */
export const resolveRegistrationPassword = (
  authConfig?: AuthConfiguration,
): RegistrationPassword =>
  isConfigEnabled(authConfig?.auth?.use_password)
    ? { needsPassword: true, password: authConfig?.['authd.pass'] || '' }
    : { needsPassword: false, password: '' };

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
 * Get the auth configuration from the cluster master node
 * This function get the config from cluster mode
 */
export const getMasterConfiguration = async () => {
  const nodes = await fetchClusterNodesOptions();
  const masterNode = getMasterNode(nodes);
  const auth = await getAuthConfiguration(masterNode[0].label);
  return {
    auth,
  };
};

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

  /* A CA pins the certificate the agent checks, so it means nothing once
  verification is off -- and the agent would still write it to the config,
  leaving a command that both supplies a CA and refuses to use it. The field
  keeps its value in the form so toggling verification back on restores it. */
  if (parsedForm.optionalParams.sslVerification === false) {
    parsedForm.optionalParams.managerCa = '';
  }

  return parsedForm;
};
