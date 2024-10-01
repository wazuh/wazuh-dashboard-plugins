import { ILogger } from '../../../../common/services/configuration';
import { StateContainer } from '../types';
import { BehaviorSubject } from 'rxjs';

export class ServerHostClusterInfoStateContainer implements StateContainer {
  private store: any;
  private storeKey: string = 'clusterInfo';
  updater$: BehaviorSubject;
  constructor(private logger: ILogger, { store }) {
    this.store = store;
    this.updater$ = new BehaviorSubject(this.get());
  }
  get() {
    try {
      this.logger.debug('Getting data');
      const rawData = this.store.get(this.storeKey);
      let result = {};
      if (rawData) {
        this.logger.debug('Getting decoded data');
        const decodedData = decodeURI(this.store.get(this.storeKey));
        this.logger.debug(`Decoded data: ${decodedData}`);
        result = JSON.parse(decodedData);
      } else {
        this.logger.debug('No raw data');
        result = {};
      }
      this.logger.debug(`Data: ${result}`);
      return result;
    } catch (error) {
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
  set(data) {
    try {
      this.logger.debug(`Setting data: ${data}`);
      const encodedData = encodeURI(JSON.stringify(data));
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
  subscribe(callback) {
    this.logger.debug('Subscribing');
    const subscription = this.updater$.subscribe(callback);
    this.logger.debug('Subscribed');
    return subscription;
  }
}
