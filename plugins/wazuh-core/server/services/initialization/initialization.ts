import { Logger } from 'opensearch-dashboards/server';
import {
  InitializationTaskDefinition,
  IInitializationService,
  InitializationTaskContext,
} from './types';
import { addRoutes } from './routes';
import { INITIALIZATION_TASK } from '../../../common/services/initialization/constants';
import { InitializationTask } from './lib/initialization-task';

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
  get(name: string) {
    this.logger.debug(`Getting task: [${name}]`);
    if (!this.items.has(name)) {
      throw new Error(`Task [${name}] not found`);
    }
    return this.items.get(name);
  }
  getAll() {
    this.logger.debug('Getting all tasks');
    return Array.from(this.items.values());
  }
  createRunContext(scope: InitializationTaskContext, context: any = {}) {
    return { ...this.services, ...context, scope };
  }
  async runAsInternal(taskNames?: string[]) {
    const ctx = this.createRunContext(INITIALIZATION_TASK.CONTEXT.INTERNAL, {
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
            } catch (error) {
              logger.error(
                `Error running task [${item.name}]: ${error.message}`,
              );
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
