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
      this.logger.error(`Error getting data: ${error.message}`);
      // TODO: implement
      // const options = {
      //   context: `${AppState.name}.getClusterInfo`,
      //   level: UI_LOGGER_LEVELS.ERROR,
      //   severity: UI_ERROR_SEVERITIES.UI,
      //   error: {
      //     error: error,
      //     message: error.message || error,
      //     title: `${error.name}: Error get cluster info`,
      //   },
      // };
      // getErrorOrchestrator().handleError(options);
      throw error;
    }
  }

  set(data: any) {
    try {
      this.logger.debug(`Setting data: ${data}`);

      const encodedData = encodeURI(JSON.stringify(data));

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
      //   context: `${AppState.name}.setClusterInfo`,
      //   level: UI_LOGGER_LEVELS.ERROR,
      //   severity: UI_ERROR_SEVERITIES.UI,
      //   error: {
      //     error: error,
      //     message: error.message || error,
      //     title: `${error.name}: Error set cluster info`,
      //   },
      // };
      // getErrorOrchestrator().handleError(options);
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
