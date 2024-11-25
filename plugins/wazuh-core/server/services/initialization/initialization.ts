import { Logger } from 'opensearch-dashboards/server';
import {
  InitializationTaskDefinition,
  IInitializationService,
  InitializationTaskRunData,
  IInitializationTask,
  InitializationTaskContext,
} from './types';
import { addRoutes } from './routes';
import {
  INITIALIZATION_TASK_CONTEXT_INTERNAL,
  INITIALIZATION_TASK_RUN_RESULT_FAIL,
  INITIALIZATION_TASK_RUN_RESULT_NULL,
  INITIALIZATION_TASK_RUN_RESULT_SUCCESS,
  INITIALIZATION_TASK_RUN_STATUS_FINISHED,
  INITIALIZATION_TASK_RUN_STATUS_NOT_STARTED,
  INITIALIZATION_TASK_RUN_STATUS_RUNNING,
} from '../../../common/services/initialization/constants';

export class InitializationService implements IInitializationService {
  private items: Map<string, InitializationTaskDefinition>;
  private _coreStart: any;
  constructor(private logger: Logger, private services: any) {
    this.items = new Map();
  }
  async setup({ core }) {
    this.logger.debug('Setup starts');
    this.logger.debug('Adding routes');
    const router = core.http.createRouter();
    addRoutes(router, { initialization: this });
    this.logger.debug('Added routes');
    this.logger.debug('Setup finished');
  }
  async start({ core }) {
    this.logger.debug('Start starts');
    this._coreStart = core;
    await this.runAsInternal();
    this.logger.debug('Start finished');
  }
  async stop() {
    this.logger.debug('Stop starts');
    this.logger.debug('Stop finished');
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
  get(name?: string) {
    this.logger.debug(`Getting tasks: ${name ? `[${name}]` : ''}`);
    if (name) {
      return this.items.get(name);
    }
  }
  getAll() {
    return Array.from(this.items.values());
  }
  createRunContext(scope: InitializationTaskContext, context: any = {}) {
    return { ...this.services, ...context, scope };
  }
  async runAsInternal(taskNames?: string[]) {
    const ctx = this.createRunContext(INITIALIZATION_TASK_CONTEXT_INTERNAL, {
      core: this._coreStart,
    });
    return await this.run(ctx, taskNames);
  }
  createNewTaskFromRegisteredTask(name: string) {
    const task = this.get(name) as InitializationTask;
    if (!task) {
      throw new Error(`Task [${name}] is not registered`);
    }
    return new InitializationTask({ name, run: task._run });
  }
  private async run(ctx, taskNames?: string[]) {
    try {
      if (this.items.size) {
        const allTasks = Array.from(this.items.values());
        const tasks = taskNames
          ? allTasks.filter(({ name }) =>
              taskNames.some(taskName => taskName === name),
            )
          : allTasks;
        const results = await Promise.all(
          tasks.map(async item => {
            const logger = this.logger.get(item.name);

            try {
              return await item.run({
                ...this.services,
                ...ctx,
                logger,
              });
            } catch (e) {
              logger.error(`Error running task [${item.name}]: ${e.message}`);
              return item.getInfo();
            }
          }),
        );
        return results;
      } else {
        this.logger.info('No tasks');
      }
    } catch (error) {
      this.logger.error(`Error starting: ${error.message}`);
    }
  }
}

class InitializationTask implements IInitializationTask {
  public name: string;
  private _run: any;
  public status: InitializationTaskRunData['status'] =
    INITIALIZATION_TASK_RUN_STATUS_NOT_STARTED;
  public result: InitializationTaskRunData['result'] =
    INITIALIZATION_TASK_RUN_RESULT_NULL;
  public data: any = null;
  public createdAt: InitializationTaskRunData['createdAt'] =
    new Date().toISOString();
  public startedAt: InitializationTaskRunData['startedAt'] = null;
  public finishedAt: InitializationTaskRunData['finishedAt'] = null;
  public duration: InitializationTaskRunData['duration'] = null;
  public error = null;
  constructor(task: InitializationTaskDefinition) {
    this.name = task.name;
    this._run = task.run;
  }
  private init() {
    this.status = INITIALIZATION_TASK_RUN_STATUS_RUNNING;
    this.result = null;
    this.data = null;
    this.startedAt = new Date().toISOString();
    this.finishedAt = null;
    this.duration = null;
    this.error = null;
  }
  async run(...params) {
    if (this.status === INITIALIZATION_TASK_RUN_STATUS_RUNNING) {
      throw new Error(`Another instance of task ${this.name} is running`);
    }
    let error;
    try {
      this.init();
      this.data = await this._run(...params);
      this.result = INITIALIZATION_TASK_RUN_RESULT_SUCCESS;
    } catch (e) {
      error = e;
      this.result = INITIALIZATION_TASK_RUN_RESULT_FAIL;
      this.error = e.message;
    } finally {
      this.status = INITIALIZATION_TASK_RUN_STATUS_FINISHED;
      this.finishedAt = new Date().toISOString();
      const dateStartedAt = new Date(this.startedAt!);
      const dateFinishedAt = new Date(this.finishedAt);
      this.duration = ((dateFinishedAt - dateStartedAt) as number) / 1000;
    }
    if (error) {
      throw error;
    }
    return this.getInfo();
  }

  getInfo() {
    return [
      'name',
      'status',
      'result',
      'data',
      'createdAt',
      'startedAt',
      'finishedAt',
      'duration',
      'error',
    ].reduce(
      (accum, item) => ({
        ...accum,
        [item]: this[item],
      }),
      {},
    ) as IInitializationTask;
  }
}
