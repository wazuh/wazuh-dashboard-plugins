import { WazuhError } from "./WazuhError";

export class WazuhApiError extends WazuhError {
  constructor(error: Error, message: string, code: number) {
    super(error,message, code);
    // Because we are extending built in class
    Object.setPrototypeOf(this, WazuhApiError.prototype);
    this.name = this.constructor.name;
  }

  handleError(){
    console.log('Show error');
  }
}
