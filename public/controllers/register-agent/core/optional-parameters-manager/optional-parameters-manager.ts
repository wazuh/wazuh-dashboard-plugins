import { NoOptionalParamFoundException } from '../exceptions';
import { IOptionalParamInput, IOptionalParameters, IOptionalParametersManager, tOptionalParams, tOptionalParamsName } from '../types';

export class OptionalParametersManager implements IOptionalParametersManager {
  constructor(private optionalParamsConfig: tOptionalParams) {}

  /**
   * Returns the command string for a given optional parameter.
   * @param props - An object containing the optional parameter name and value.
   * @returns The command string for the given optional parameter.
   * @throws NoOptionalParamFoundException if the given optional parameter name is not found in the configuration.
   */
  getOptionalParam(props: IOptionalParamInput) {
    const { value, name } = props;
    if (!this.optionalParamsConfig[name]) {
      throw new NoOptionalParamFoundException(name);
    }
    return this.optionalParamsConfig[name].getParamCommand({
        value,
        property: this.optionalParamsConfig[name].property,
        name
    });
  }

  /**
   * Returns an object containing the command strings for all optional parameters with non-empty values.
   * @param paramsValues - An object containing the optional parameter names and values.
   * @returns An object containing the command strings for all optional parameters with non-empty values.
   * @throws NoOptionalParamFoundException if any of the given optional parameter names is not found in the configuration.
   */
  getAllOptionalParams(paramsValues: IOptionalParameters){
      // get keys for only the optional params with values !== ''
      const optionalParams = Object.keys(paramsValues).filter(key => paramsValues[key as keyof typeof paramsValues] !== '') as tOptionalParamsName[];
      const resolvedOptionalParams: any = {};
      for(const param of optionalParams){
          if(!this.optionalParamsConfig[param]){
              throw new NoOptionalParamFoundException(param);
          }

          const paramDef = this.optionalParamsConfig[param];
          resolvedOptionalParams[param] = paramDef.getParamCommand({
              name: param,
              value: paramsValues[param as keyof typeof paramsValues] as string,
              property: paramDef.property
          }) as string;
      }
      return resolvedOptionalParams;
  }
}
