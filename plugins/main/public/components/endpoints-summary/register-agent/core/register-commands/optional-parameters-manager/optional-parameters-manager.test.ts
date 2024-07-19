import { NoOptionalParamFoundException } from '../exceptions';
import {
  IOptionalParameters,
  tOptionalParams,
  tOptionalParamsCommandProps,
} from '../types';
import { OptionalParametersManager } from './optional-parameters-manager';

type tOptionalParamsFieldname =
  | 'server_address'
  | 'protocol'
  | 'agent_group'
  | 'wazuh_password'
  | 'another_valid_fieldname';

const returnOptionalParam = (
  props: tOptionalParamsCommandProps<tOptionalParamsFieldname>,
) => {
  const { property, value } = props;
  return `${property}=${value}`;
};
const optionalParametersDefinition: tOptionalParams<tOptionalParamsFieldname> =
  {
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
    server_address: {
      property: 'WAZUH_MANAGER',
      getParamCommand: returnOptionalParam,
    },
    another_valid_fieldname: {
      property: 'WAZUH_ANOTHER_PROPERTY',
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
    ['protocol', 'TCP'],
    ['agent_group', 'group1'],
    ['wazuh_password', '123456'],
    ['another_valid_fieldname', 'another_valid_value']
  ])(
    `should return the corresponding command for "%s" param with "%s" value`,
    (name, value) => {
      const optParamManager = new OptionalParametersManager(
        optionalParametersDefinition,
      );
      const commandParam = optParamManager.getOptionalParam({
        name: name as tOptionalParamsFieldname,
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
          name: name as tOptionalParamsFieldname,
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
    const paramsValues: IOptionalParameters<tOptionalParamsFieldname> = {
      protocol: 'TCP',
      agent_group: 'group1',
      wazuh_password: '123456',
      server_address: 'server',
      another_valid_fieldname: 'another_valid_value',
    };
    const resolvedParams = optParamManager.getAllOptionalParams(paramsValues);
    expect(resolvedParams).toEqual({
      agent_group: optionalParametersDefinition.agent_group.getParamCommand({
        name: 'agent_group',
        property: optionalParametersDefinition.agent_group.property,
        value: paramsValues.agent_group,
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
      another_valid_fieldname:
        optionalParametersDefinition.another_valid_fieldname.getParamCommand({
          name: 'another_valid_fieldname',
          property:
            optionalParametersDefinition.another_valid_fieldname.property,
          value: paramsValues.another_valid_fieldname,
        }),
    } as IOptionalParameters<tOptionalParamsFieldname>);
  });

  it('should return the corresponse command for all the params with NOT empty values', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues: IOptionalParameters<tOptionalParamsFieldname> = {
      protocol: 'TCP',
      agent_group: 'group1',
      wazuh_password: '123456',
      server_address: 'server',
      another_valid_fieldname: 'another_valid_value',
    };

    const resolvedParams = optParamManager.getAllOptionalParams(paramsValues);
    expect(resolvedParams).toEqual({
      agent_group: optionalParametersDefinition.agent_group.getParamCommand({
        name: 'agent_group',
        property: optionalParametersDefinition.agent_group.property,
        value: paramsValues.agent_group,
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
      another_valid_fieldname:
        optionalParametersDefinition.another_valid_fieldname.getParamCommand({
          name: 'another_valid_fieldname',
          property:
            optionalParametersDefinition.another_valid_fieldname.property,
          value: paramsValues.another_valid_fieldname,
        }),
    } as IOptionalParameters<tOptionalParamsFieldname>);
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
