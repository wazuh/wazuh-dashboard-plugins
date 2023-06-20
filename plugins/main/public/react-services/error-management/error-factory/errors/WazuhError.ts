import { IWazuhError, IWazuhErrorInfo, IWazuhErrorLogOpts } from "../../types";


export default abstract class WazuhError extends Error {
    abstract logOptions: IWazuhErrorLogOpts;
    constructor(public error: Error, info?: IWazuhErrorInfo) {
        super(info?.message || error.message);
        const childrenName = this.constructor.name; // keep the children class name
        Object.setPrototypeOf(this, WazuhError.prototype); // Because we are extending built in class
        this.name = childrenName;
        this.stack = this.error.stack; // keep the stack trace from children
    }
}