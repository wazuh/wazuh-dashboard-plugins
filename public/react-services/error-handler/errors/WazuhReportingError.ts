export class WazuhReportingError extends Error {
  constructor(message: string) {
    super(message);
    // Because we are extending built in class
    Object.setPrototypeOf(this, WazuhReportingError.prototype);
    this.name = this.constructor.name;
  }
}
