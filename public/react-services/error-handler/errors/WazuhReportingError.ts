import { WazuhError } from "./WazuhError";

export class WazuhReportingError extends WazuhError {
  constructor(error: Error, message: string, code: number) {
    super(error,message, code);
    // Because we are extending built in class
    Object.setPrototypeOf(this, WazuhReportingError.prototype);
    this.name = this.constructor.name;
  }

  handleError(){
    console.log('Show error');
  }
}
