import { ILogger } from '../../../../common/services/configuration';
import { StateContainer } from '../types';
import { BehaviorSubject } from 'rxjs';

export class ServerHostStateContainer implements StateContainer {
  private store: any;
  private storeKey: string = 'currentApi';
  updater$: BehaviorSubject<string>;
  constructor(private logger: ILogger, { store }) {
    this.store = store;
    this.updater$ = new BehaviorSubject(this.get());
  }
  get() {
    this.logger.debug('Getting data');
    const currentAPI = this.store.get(this.storeKey);
    this.logger.debug(`Raw data: ${currentAPI}`);
    if (currentAPI) {
      this.logger.debug('Decoding data');
      const decodedData = decodeURI(currentAPI);
      this.logger.debug(`Decoded data: ${decodedData}`);
      return decodedData;
    }
    return false;
  }
  set(data) {
    try {
      this.logger.debug(`Setting data: ${data}`);
      const encodedData = encodeURI(data);
      this.logger.debug(`Setting encoded data: ${encodedData}`);
      const exp = new Date();
      exp.setDate(exp.getDate() + 365);
      if (data) {
        this.store.set(this.storeKey, encodedData, {
          expires: exp,
        });
        this.updater$.next(encodedData);
        this.logger.debug(`Encoded data was set: ${encodedData}`);
      }
    } catch (error) {
      // TODO: implement
      // const options = {
      //   context: `${AppState.name}.setCurrentAPI`,
      //   level: UI_LOGGER_LEVELS.ERROR,
      //   severity: UI_ERROR_SEVERITIES.UI,
      //   error: {
      //     error: error,
      //     message: error.message || error,
      //     title: `${error.name}: Error set current API`,
      //   },
      // };
      // getErrorOrchestrator().handleError(options);
      throw error;
    }
  }
  remove() {
    this.logger.debug('Removing');
    const result = this.store.remove(this.storeKey);
    this.updater$.next(undefined);
    this.logger.debug('Removed');
    return result;
  }
  subscribe(callback) {
    this.logger.debug('Subscribing');
    const subscription = this.updater$.subscribe(callback);
    this.logger.debug('Subscribed');
    return subscription;
  }
}
