import WazuhError from "./WazuhError";

export class WazuhApiError extends WazuhError {
  constructor(error: Error, message: string, code?: number) {
    super(error,message, code);
  }

  handleError(){
    console.log('Show error');
  }
}
