import { IWazuhError, IWazuhErrorInfo, IWazuhErrorLogOpts } from "../../types";


export default abstract class WazuhError extends Error {
    error: Error;
    code?: number;
    abstract logOptions: IWazuhErrorLogOpts;
    constructor(error: Error, info?: IWazuhErrorInfo) {
        super(info?.message || error.message);
        this.error = error;
        this.code = info?.code;
        const childrenName = this.constructor.name; // keep the children class name
        Object.setPrototypeOf(this, WazuhError.prototype); // Because we are extending built in class
        this.name = childrenName;
        this.stack = this.error.stack; // keep the stack trace from children
    }
}