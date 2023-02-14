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
        // Because we are extending built in class
        Object.setPrototypeOf(this, WazuhError.prototype);
        this.name = this.constructor.name;
    }
    /**
     * This method decides how to treat the error
     */
    handleError(){
        throw new Error('Handle Error must be implemented!');
    }
}