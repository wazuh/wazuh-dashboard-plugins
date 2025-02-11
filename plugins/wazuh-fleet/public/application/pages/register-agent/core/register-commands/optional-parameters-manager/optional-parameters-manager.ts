import { NoOptionalParamFoundException } from '../exceptions';
import {
  IOperationSystem,
  IOptionalParamInput,
  IOptionalParameters,
  IOptionalParametersManager,
  tOptionalParams,
} from '../types';

export class OptionalParametersManager<Params extends string>
  implements IOptionalParametersManager<Params>
{
  constructor(private readonly optionalParamsConfig: tOptionalParams<Params>) {}

  /**
   * Returns the command string for a given optional parameter.
   * @param props - An object containing the optional parameter name and value.
   * @returns The command string for the given optional parameter.
   * @throws NoOptionalParamFoundException if the given optional parameter name is not found in the configuration.
   */
  getOptionalParam(
    props: IOptionalParamInput<Params>,
    selectedOS?: IOperationSystem,
  ) {
    const { value, name } = props;

    if (!this.optionalParamsConfig[name]) {
      throw new NoOptionalParamFoundException(name);
    }

    return this.optionalParamsConfig[name].getParamCommand(
      {
        value,
        property: this.optionalParamsConfig[name].property,
        name,
      },
      selectedOS,
    );
  }

  /**
   * Returns an object containing the command strings for all optional parameters with non-empty values.
   * @param paramsValues - An object containing the optional parameter names and values.
   * @returns An object containing the command strings for all optional parameters with non-empty values.
   * @throws NoOptionalParamFoundException if any of the given optional parameter names is not found in the configuration.
   */
  getAllOptionalParams(
    paramsValues: IOptionalParameters<Params>,
    selectedOS: IOperationSystem,
  ) {
    // get keys for only the optional params with values !== ''
    const optionalParams = Object.keys(paramsValues).filter(
      key => paramsValues[key as keyof typeof paramsValues] !== '',
    ) as (keyof typeof paramsValues)[];
    const resolvedOptionalParams: any = {};

    for (const param of optionalParams) {
      if (!this.optionalParamsConfig[param]) {
        throw new NoOptionalParamFoundException(param as string);
      }

      const paramDef = this.optionalParamsConfig[param];

      resolvedOptionalParams[param as string] = paramDef.getParamCommand(
        {
          name: param as Params,
          value: paramsValues[param] as string,
          property: paramDef.property,
        },
        selectedOS,
      ) as string;
    }

    return resolvedOptionalParams;
  }
}
