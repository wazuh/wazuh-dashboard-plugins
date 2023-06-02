import { NoOptionalParamFoundException } from '../exceptions';
import {
  IOptionalParameters,
  tOptionalParams,
  tOptionalParamsCommandProps,
  tOptionalParamsName,
} from '../types';
import { OptionalParametersManager } from './optional-parameters-manager';

const returnOptionalParam = (props: tOptionalParamsCommandProps) => {
  const { property, value } = props;
  return `${property}=${value}`;
};
const optionalParametersDefinition: tOptionalParams = {
  server_address: {
    property: 'WAZUH_MANAGER',
    getParamCommand: returnOptionalParam,
  },
  agent_name: {
    property: 'WAZUH_AGENT_NAME',
    getParamCommand: returnOptionalParam,
  },
  protocol: {
    property: 'WAZUH_MANAGER_PROTOCOL',
    getParamCommand: returnOptionalParam,
  },
  agent_group: {
    property: 'WAZUH_AGENT_GROUP',
    getParamCommand: returnOptionalParam,
  },
  wazuh_password: {
    property: 'WAZUH_PASSWORD',
    getParamCommand: returnOptionalParam,
  },
};

describe('Optional Parameters Manager', () => {
  it('should create an instance successfully', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    expect(optParamManager).toBeDefined();
  });

  it.each([
    ['server_address', '10.10.10.27'],
    ['agent_name', 'agent1'],
    ['protocol', 'TCP'],
    ['agent_group', 'group1'],
    ['wazuh_password', '123456'],
  ])(
    `should return the corresponding command for "%s" param with "%s" value`,
    (name, value) => {
      const optParamManager = new OptionalParametersManager(
        optionalParametersDefinition,
      );
      const commandParam = optParamManager.getOptionalParam({
        name: name as tOptionalParamsName,
        value,
      });
      const defs =
        optionalParametersDefinition[
          name as keyof typeof optionalParametersDefinition
        ];
      expect(commandParam).toBe(
        defs.getParamCommand({
          property: defs.property,
          value,
          name: name as tOptionalParamsName,
        }),
      );
    },
  );

  it('should return ERROR when the param received is not defined in the params definition', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const invalidParam = 'invalid_optional_param';
    try {
      // @ts-ignore
      optParamManager.getOptionalParam({ name: invalidParam, value: 'value' });
    } catch (error) {
      expect(error).toBeInstanceOf(NoOptionalParamFoundException);
    }
  });

  it('should return the corresponding command for all the params', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues: IOptionalParameters = {
      server_address: '10.10.10.27',
      agent_name: 'agent1',
      protocol: 'TCP',
      agent_group: 'group1',
      wazuh_password: '123456',
    };
    const resolvedParams = optParamManager.getAllOptionalParams(paramsValues);
    expect(resolvedParams).toEqual({
      agent_group: optionalParametersDefinition.agent_group.getParamCommand({
        name: 'agent_group',
        property: optionalParametersDefinition.agent_group.property,
        value: paramsValues.agent_group,
      }),
      agent_name: optionalParametersDefinition.agent_name.getParamCommand({
        name: 'agent_name',
        property: optionalParametersDefinition.agent_name.property,
        value: paramsValues.agent_name,
      }),
      protocol: optionalParametersDefinition.protocol.getParamCommand({
        name: 'protocol',
        property: optionalParametersDefinition.protocol.property,
        value: paramsValues.protocol,
      }),
      server_address:
        optionalParametersDefinition.server_address.getParamCommand({
          name: 'server_address',
          property: optionalParametersDefinition.server_address.property,
          value: paramsValues.server_address,
        }),
      wazuh_password:
        optionalParametersDefinition.wazuh_password.getParamCommand({
          name: 'wazuh_password',
          property: optionalParametersDefinition.wazuh_password.property,
          value: paramsValues.wazuh_password,
        }),
    } as IOptionalParameters);
  });

  it('should return the corresponse command for all the params with NOT empty values', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues: IOptionalParameters = {
      server_address: '',
      agent_name: 'agent1',
      protocol: 'TCP',
      agent_group: '',
      wazuh_password: '123456',
    };

    const resolvedParams = optParamManager.getAllOptionalParams(paramsValues);
    expect(resolvedParams).toEqual({
      agent_name: optionalParametersDefinition.agent_name.getParamCommand({
        name: 'agent_name',
        property: optionalParametersDefinition.agent_name.property,
        value: paramsValues.agent_name,
      }),
      protocol: optionalParametersDefinition.protocol.getParamCommand({
        name: 'protocol',
        property: optionalParametersDefinition.protocol.property,
        value: paramsValues.protocol,
      }),
      wazuh_password:
        optionalParametersDefinition.wazuh_password.getParamCommand({
          name: 'wazuh_password',
          property: optionalParametersDefinition.wazuh_password.property,
          value: paramsValues.wazuh_password,
        }),
    } as IOptionalParameters);
  });

  it('should return ERROR when the param received is not defined in the params definition', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues = {
      serverAddress: 'invalid server address property value',
    };

    try {
      // @ts-ignore
      optParamManager.getAllOptionalParams(paramsValues);
    } catch (error) {
      expect(error).toBeInstanceOf(NoOptionalParamFoundException);
    }
  });

  it('should return empty object response when receive an empty params object', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues = {};
    // @ts-ignore
    const optionals = optParamManager.getAllOptionalParams(paramsValues);
    expect(optionals).toEqual({});
  });

  it('should return empty object response when receive all the params values with empty string ("")', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues = {
      server_address: '',
      agent_name: '',
      protocol: '',
      agent_group: '',
      wazuh_password: '',
    };
    // @ts-ignore
    const optionals = optParamManager.getAllOptionalParams(paramsValues);
    expect(optionals).toEqual({});
  });
});
