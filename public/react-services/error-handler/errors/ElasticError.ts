import { WazuhError } from "./WazuhError";

export class ElasticError extends WazuhError {
  constructor(error: Error, message: string, code: number) {
    super(error,message, code);
    // Because we are extending built in class
    Object.setPrototypeOf(this, ElasticError.prototype);
    this.name = this.constructor.name;
  }

  handleError(){
    console.log('Show error');
  }
}
