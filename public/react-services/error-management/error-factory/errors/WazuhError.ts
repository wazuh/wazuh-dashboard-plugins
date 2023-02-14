import { IWazuhError } from "../../types";

export default class WazuhError extends Error implements IWazuhError  {
    error: Error;
    message: string;
    code?: number;
    constructor(error: Error, message: string, code?: number) {
        super(message);
        this.error = error;
        this.message = message;
        if(code)
        this.code = code;
        const childrenName = this.constructor.name; // keep the children class name
        Object.setPrototypeOf(this, WazuhError.prototype); // Because we are extending built in class
        this.name = childrenName;
        this.stack = this.error.stack; // keep the stack trace from children
    }
    /**
     * This method decides how to treat the error
     */
    handleError(){
        throw new Error('Handle Error must be implemented!');
    }
}