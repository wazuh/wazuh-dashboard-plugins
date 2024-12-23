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

      return decodedData ? JSON.parse(decodedData) : {};
    }

    return false;
  }

  set(data: object) {
    try {
      const stringifyData = JSON.stringify(data);

      this.logger.debug(`Setting data: ${stringifyData}`);

      const encodedData = encodeURI(stringifyData);

      this.logger.debug(`Setting encoded data: ${encodedData}`);

      const exp = new Date();

      exp.setDate(exp.getDate() + 365);

      if (data) {
        this.store.set(this.STORE_KEY, encodedData, {
          expires: exp,
        });
        this.updater$.next(data);
        this.logger.debug(`Encoded data was set: ${encodedData}`);
      }
    } catch (error) {
      this.logger.error(`Error setting data: ${(error as Error).message}`);
      // Emit the error
      this.updater$.next({ error, method: 'set' });
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
