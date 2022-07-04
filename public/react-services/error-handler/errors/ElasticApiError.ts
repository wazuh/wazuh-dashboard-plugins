export class ElasticApiError extends Error {
  constructor(message: string) {
    super(message);
    // Because we are extending built in class
    Object.setPrototypeOf(this, ElasticApiError.prototype);
    this.name = this.constructor.name;
  }
}
