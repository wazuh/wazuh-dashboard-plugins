import { Logger } from 'opensearch-dashboards/server';
import { IndexPatternsFetcher } from '../../../../../src/plugins/data/server';
import {
  InitializationTaskDefinition,
  IInitializationService,
  InitializationTaskRunData,
} from './types';

export class InitializationService implements IInitializationService {
  private items: Map<string, InitializationTaskDefinition>;
  constructor(private logger: Logger, private services: any) {
    this.items = new Map();
  }
  async setup() {
    this.logger.debug('Setup');
  }
  async start({ core }) {
    try {
      this.logger.debug('Starting');
      const savedObjectsClient = core.savedObjects.createInternalRepository();
      const indexPatternsClient = new IndexPatternsFetcher(
        core.opensearch.legacy.client.callAsInternalUser,
      );
      if (this.items.size) {
        await Promise.all(
          Array.from(this.items.entries()).map(async ([name, item]) => {
            const logger = this.logger.get(name);
            try {
              await item.run({
                ...this.services,
                core,
                savedObjectsClient,
                indexPatternsClient,
                logger,
              });
            } catch (e) {
              logger.error(`Error running task [${name}]: ${e.message}`);
            }
          }),
        );

        this.logger.info('Start finished');
      } else {
        this.logger.info('No tasks');
      }
    } catch (error) {
      this.logger.error(`Error starting: ${error.message}`);
    }
  }
  async stop() {
    this.logger.debug('Stop');
  }
  register(task: InitializationTaskDefinition) {
    this.logger.debug(`Registering ${task.name}`);
    if (this.items.has(task.name)) {
      throw new Error(
        `[${task.name}] was already registered. Ensure the name is unique or remove the duplicated registration of same task.`,
      );
    }
    this.items.set(task.name, new InitializationTask(task));
    this.logger.debug(`Registered ${task.name}`);
  }
  get(taskName?: string) {
    this.logger.debug(`Getting tasks: ${taskName ? `[${taskName}]` : ''}`);
    if (taskName) {
      return this.items.get(taskName);
    }
    return Array.from(this.items.values());
  }
}

class InitializationTask implements InitializationTaskRunData {
  public name: string;
  private _run: any;
  public status: InitializationTaskRunData['status'] = 'not_started';
  public result: InitializationTaskRunData['result'] = null;
  public data: any = null;
  public startAt: number | null = null;
  public endAt: number | null = null;
  public duration: number | null = null;
  public error: string | null = null;
  constructor(task: InitializationTaskDefinition) {
    this.name = task.name;
    this._run = task.run;
  }
  private init() {
    this.status = 'running';
    this.result = null;
    this.data = null;
    this.startAt = Date.now();
    this.endAt = null;
    this.duration = null;
    this.error = null;
  }
  private setResult(result) {
    this.result = result;
  }
  async run(...params) {
    let error;
    try {
      this.init();
      this.data = await this._run(...params);
      this.setResult('success');
    } catch (e) {
      error = e;
      this.setResult('fail');
      this.error = e.message;
    } finally {
      this.status = 'finished';
      this.endAt = Date.now();
      this.duration = this.endAt - (this.startAt as number);
    }
    if (error) {
      throw error;
    }
    return this.data;
  }
  getStatus() {
    return [
      'status',
      'result',
      'data',
      'startAt',
      'endAt',
      'duration',
      'error',
    ].reduce(
      (accum, item) => ({
        ...accum,
        [item]: this[item],
      }),
      {},
    );
  }
}
