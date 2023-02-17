import { IWazuhError, IWazuhErrorLogOpts } from "../../types";

export default class WazuhError extends Error implements IWazuhError  {
    error: Error;
    message: string;
    code?: number;
    logOptions: IWazuhErrorLogOpts;
    constructor(error: Error, message: string, logOptions: IWazuhErrorLogOpts, code?: number) {
        super(message);
        this.error = error;
        this.message = message;
        this.logOptions = logOptions;
        if(code)
        this.code = code;
        const childrenName = this.constructor.name; // keep the children class name
        Object.setPrototypeOf(this, WazuhError.prototype); // Because we are extending built in class
        this.name = childrenName;
        this.stack = this.error.stack; // keep the stack trace from children
    }

    /**
     * This options define how the error will be logged and treated
     
    public get logOptions(): IWazuhErrorLogOpts {
        throw new Error('Log options must be defined!');
    }
    */

}