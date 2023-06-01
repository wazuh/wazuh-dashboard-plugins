import { IOptionalParams, IOptionsParamConfig } from "../../types";

interface IOptionalParametersManager {

}

const optionalParameters: IOptionalParams = {
    serverAddress: {
        property: 'WAZUH_MANAGER',
        getParamCommand: (property: string, value: string) => `${property}=${value}`
    }
}


export class OptionalParametersManager implements IOptionalParametersManager {
    private _value: string = '';
    
    constructor(name: string, private config: IOptionsParamConfig) {
    }

    getOptionalParam(value: string) {
        return this.config.getParamCommand(this.config.property, value);
    }
}