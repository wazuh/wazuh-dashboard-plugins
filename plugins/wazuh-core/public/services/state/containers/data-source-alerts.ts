import { ILogger } from '../../../../common/services/configuration';
import { StateContainer } from '../types';
import { BehaviorSubject } from 'rxjs';

export class DataSourceAlertsStateContainer implements StateContainer {
  private store: any;
  private storeKey: string = 'currentPattern';
  updater$: BehaviorSubject;
  constructor(private logger: ILogger, { store }) {
    this.store = store;
    this.updater$ = new BehaviorSubject(this.get());
  }
  get() {
    try {
      this.logger.debug('Getting data');
      const rawData = this.store.get(this.storeKey);

      let result = '';
      if (rawData) {
        this.logger.debug('Getting decoded data');
        let decodedData = decodeURI(rawData);
        this.logger.debug(`Decoded data: ${decodedData}`);

        /* I assume in previous versions, the selected index pattern could be wrapped with " characters.
          This could probably removed if we confirm it is unused anymore. I will leave for historical reasons.
        */
        if (
          decodedData &&
          decodedData[0] === '"' &&
          decodedData[decodedData.length - 1] === '"'
        ) {
          const newPattern = decodedData.substring(1, decodedData.length - 1);
          this.set(newPattern);
          decodedData = decodeURI(this.store.get('currentPattern'));
        }

        result = decodedData;
      } else {
        this.logger.debug('No raw data');
        result = '';
      }
      this.logger.debug(`Data: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
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
      this.logger.error(error.message);
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
  remove() {
    try {
      this.logger.debug('Removing');
      const result = this.store.remove(this.storeKey);
      this.updater$.next(undefined);
      this.logger.debug('Removed');
      return result;
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }
  }
  subscribe(callback) {
    this.logger.debug('Subscribing');
    const subscription = this.updater$.subscribe(callback);
    this.logger.debug('Subscribed');
    return subscription;
  }
}
