export class WazuhApiError extends Error {
  constructor(message: string) {
    super(message);
    // Because we are extending built in class
    Object.setPrototypeOf(this, WazuhApiError.prototype);
    this.name = this.constructor.name;
  }
}
