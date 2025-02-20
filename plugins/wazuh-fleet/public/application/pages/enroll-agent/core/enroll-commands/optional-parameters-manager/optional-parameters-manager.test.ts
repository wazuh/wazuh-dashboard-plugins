import { NoOptionalParamFoundException } from '../exceptions';
import {
  IOptionalParameters,
  TOptionalParams,
  TOptionalParamsCommandProps,
} from '../types';
import { OptionalParametersManager } from './optional-parameters-manager';

type TOptionalParamsFieldname =
  | 'server_address'
  | 'username'
  | 'password'
  | 'another_valid_fieldname';

const returnOptionalParam = (
  props: TOptionalParamsCommandProps<TOptionalParamsFieldname>,
) => {
  const { property, value } = props;

  return `${property} '${value}'`;
};

const optionalParametersDefinition: TOptionalParams<TOptionalParamsFieldname> =
  {
    username: {
      property: '--user',
      getParamCommand: returnOptionalParam,
    },
    password: {
      property: '--password',
      getParamCommand: returnOptionalParam,
    },
    server_address: {
      property: '--url',
      getParamCommand: returnOptionalParam,
    },
    another_valid_fieldname: {
      property: '--another-field',
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
    ['username', 'user'],
    ['password', '123456'],
    ['another_valid_fieldname', 'another_valid_value'],
  ])(
    `should return the corresponding command for "%s" param with "%s" value`,
    (name, value) => {
      const optParamManager = new OptionalParametersManager(
        optionalParametersDefinition,
      );
      const commandParam = optParamManager.getOptionalParam({
        name: name as TOptionalParamsFieldname,
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
          name: name as TOptionalParamsFieldname,
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
      optParamManager.getOptionalParam({ name: invalidParam, value: 'value' });
    } catch (error) {
      expect(error).toBeInstanceOf(NoOptionalParamFoundException);
    }
  });

  it('should return the corresponding command for all the params', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues: IOptionalParameters<TOptionalParamsFieldname> = {
      username: 'user',
      password: '123456',
      server_address: 'server',
      another_valid_fieldname: 'another_valid_value',
    };
    const resolvedParams = optParamManager.getAllOptionalParams(paramsValues);

    expect(resolvedParams).toEqual({
      username: optionalParametersDefinition.username.getParamCommand({
        name: 'username',
        property: optionalParametersDefinition.username.property,
        value: paramsValues.username,
      }),
      server_address:
        optionalParametersDefinition.server_address.getParamCommand({
          name: 'server_address',
          property: optionalParametersDefinition.server_address.property,
          value: paramsValues.server_address,
        }),
      password: optionalParametersDefinition.password.getParamCommand({
        name: 'password',
        property: optionalParametersDefinition.password.property,
        value: paramsValues.password,
      }),
      another_valid_fieldname:
        optionalParametersDefinition.another_valid_fieldname.getParamCommand({
          name: 'another_valid_fieldname',
          property:
            optionalParametersDefinition.another_valid_fieldname.property,
          value: paramsValues.another_valid_fieldname,
        }),
    } as IOptionalParameters<TOptionalParamsFieldname>);
  });

  it('should return the corresponse command for all the params with NOT empty values', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues: IOptionalParameters<TOptionalParamsFieldname> = {
      username: 'user',
      password: '123456',
      server_address: 'server',
      another_valid_fieldname: 'another_valid_value',
    };
    const resolvedParams = optParamManager.getAllOptionalParams(paramsValues);

    expect(resolvedParams).toEqual({
      username: optionalParametersDefinition.username.getParamCommand({
        name: 'username',
        property: optionalParametersDefinition.username.property,
        value: paramsValues.username,
      }),
      server_address:
        optionalParametersDefinition.server_address.getParamCommand({
          name: 'server_address',
          property: optionalParametersDefinition.server_address.property,
          value: paramsValues.server_address,
        }),
      password: optionalParametersDefinition.password.getParamCommand({
        name: 'password',
        property: optionalParametersDefinition.password.property,
        value: paramsValues.password,
      }),
      another_valid_fieldname:
        optionalParametersDefinition.another_valid_fieldname.getParamCommand({
          name: 'another_valid_fieldname',
          property:
            optionalParametersDefinition.another_valid_fieldname.property,
          value: paramsValues.another_valid_fieldname,
        }),
    } as IOptionalParameters<TOptionalParamsFieldname>);
  });

  it('should return ERROR when the param received is not defined in the params definition', () => {
    const optParamManager = new OptionalParametersManager(
      optionalParametersDefinition,
    );
    const paramsValues = {
      serverAddress: 'invalid server address property value',
    };

    try {
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
      username: '',
      password: '',
    };
    const optionals = optParamManager.getAllOptionalParams(paramsValues);

    expect(optionals).toEqual({});
  });
});
