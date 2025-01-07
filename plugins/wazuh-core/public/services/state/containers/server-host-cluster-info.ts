import { BehaviorSubject } from 'rxjs';
import { Logger } from '../../../../common/services/configuration';
import { StateContainer } from '../types';

export class ServerHostClusterInfoStateContainer implements StateContainer {
  private readonly store: any;
  private readonly STORE_KEY = 'clusterInfo';
  updater$: BehaviorSubject<string>;

  constructor(
    private readonly logger: Logger,
    { store },
  ) {
    this.store = store;
    this.updater$ = new BehaviorSubject(this.get());
  }

  get() {
    try {
      this.logger.debug('Getting data');

      const rawData = this.store.get(this.STORE_KEY);
      let result = {};

      if (rawData) {
        this.logger.debug('Getting decoded data');

        const decodedData = decodeURI(rawData);

        this.logger.debug(`Decoded data: ${decodedData}`);
        result = JSON.parse(decodedData);
      } else {
        this.logger.debug('No raw data');
        result = {};
      }

      this.logger.debug(`Data: ${result}`);

      return result;
    } catch (error) {
      this.logger.error(`Error getting data: ${(error as Error).message}`);
      // Emit the error
      this.updater$.next({ error, method: 'get' });
      throw error;
    }
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

  remove() {}

  subscribe(callback: (value: any) => void) {
    this.logger.debug('Subscribing');

    const subscription = this.updater$.subscribe(callback);

    this.logger.debug('Subscribed');

    return subscription;
  }
}
