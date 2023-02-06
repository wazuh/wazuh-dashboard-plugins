interface iWazuhError {
    error: Error;
    message: string;
    code: number;
    handleError(): void;
}

export abstract class WazuhError extends Error implements iWazuhError  {
    error: Error;
    message: string;
    code: number;
    constructor(error: Error, message: string, code: number) {
        super(message);
        this.error = error;
        this.message = message;
        this.code = code;
    }

    /**
     * This method decides how to treat the error
     */
    abstract handleError(): void;
}