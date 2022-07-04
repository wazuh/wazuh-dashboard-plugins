export class ElasticError extends Error {
  constructor(message: string) {
    super(message);
    // Because we are extending built in class
    Object.setPrototypeOf(this, ElasticError.prototype);
    this.name = this.constructor.name;
  }
}
