import { ErrorHandler } from '../error-handler';

export const errorHandlerDecorator = (fn: any) => {
  //if (typeof fn !== 'function') {
    return function (...args: any) {
      try {
        return fn(...args);
      } catch (error) {
        if (error instanceof Error) {
          ErrorHandler.handleError(error);
        }
      }
    };
  //}
  //return fn;
};

export function errorHandlerWrapper() {
  return function(target: any, propertyKey: string) {
    const value = target[propertyKey];
    const descriptor = {
      value: function(...args: any[]) {
        value.apply(this, args);
        console.log(`${propertyKey} was executed.`);
      }
    };
    Reflect.deleteProperty(target, propertyKey);
    Reflect.defineProperty(target, propertyKey, descriptor);
  };

}
