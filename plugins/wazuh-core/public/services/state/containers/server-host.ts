import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../../../common/services/configuration';
import { StateContainer } from '../types';

export class ServerHostStateContainer implements StateContainer {
  private readonly store: any;
  private readonly STORE_KEY = 'currentApi';
  updater$: BehaviorSubject<string>;

  constructor(
    private readonly logger: Logger,
    { store },
  ) {
    this.store = store;
    this.updater$ = new BehaviorSubject(this.get());
  }

  get() {
    this.logger.debug('Getting data');

    const currentAPI = this.store.get(this.STORE_KEY);

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
        this.store.set(this.STORE_KEY, encodedData, {
          expires: exp,
        });
        this.updater$.next(encodedData);
        this.logger.debug(`Encoded data was set: ${encodedData}`);
      }
    } catch (error) {
      this.logger.error(`Error setting data: ${error.message}`);
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

    const result = this.store.remove(this.STORE_KEY);

    this.updater$.next();
    this.logger.debug('Removed');

    return result;
  }

  subscribe(callback: (value: any) => void) {
    this.logger.debug('Subscribing');

    const subscription = this.updater$.subscribe(callback);

    this.logger.debug('Subscribed');

    return subscription;
  }
}
