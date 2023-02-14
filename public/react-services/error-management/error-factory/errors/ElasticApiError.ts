import { IWazuhError } from "../../types";
import WazuhError from "./WazuhError";

export class ElasticApiError extends WazuhError implements IWazuhError {
  constructor(error: Error, message: string, code?: number) {
    super(error,message, code);
    // Because we are extending built in class
    Object.setPrototypeOf(this, ElasticApiError.prototype);
    this.name = this.constructor.name;
  }

  handleError(){
    console.log('Show error');
  }
}
