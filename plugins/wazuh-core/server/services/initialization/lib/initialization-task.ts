import {
  InitializationTaskDefinition,
  InitializationTaskRunData,
  IInitializationTask,
} from '../types';
import { INITIALIZATION_TASK } from '../../../../common/services/initialization/constants';

export class InitializationTask implements IInitializationTask {
  public name: string;
  private readonly runInternal: any;
  public status: InitializationTaskRunData['status'] =
    INITIALIZATION_TASK.RUN_STATUS.NOT_STARTED;
  public result: InitializationTaskRunData['result'] =
    INITIALIZATION_TASK.RUN_RESULT.NULL;
  public data: any = null;
  public createdAt: InitializationTaskRunData['createdAt'] =
    new Date().toISOString();
  public startedAt: InitializationTaskRunData['startedAt'] = null;
  public finishedAt: InitializationTaskRunData['finishedAt'] = null;
  public duration: InitializationTaskRunData['duration'] = null;
  public error = null;

  constructor(task: InitializationTaskDefinition) {
    this.name = task.name;
    this.runInternal = task.run;
  }

  private init() {
    this.status = INITIALIZATION_TASK.RUN_STATUS.RUNNING;
    this.result = null;
    this.data = null;
    this.startedAt = new Date().toISOString();
    this.finishedAt = null;
    this.duration = null;
    this.error = null;
  }

  async run(...params) {
    if (this.status === INITIALIZATION_TASK.RUN_STATUS.RUNNING) {
      throw new Error(`Another instance of task ${this.name} is running`);
    }

    let error;

    try {
      this.init();
      this.data = await this.runInternal(...params);
      this.result = INITIALIZATION_TASK.RUN_RESULT.SUCCESS;
    } catch (error_) {
      error = error_;
      this.result = INITIALIZATION_TASK.RUN_RESULT.FAIL;
      this.error = error_.message;
    } finally {
      this.status = INITIALIZATION_TASK.RUN_STATUS.FINISHED;
      this.finishedAt = new Date().toISOString();

      const dateStartedAt = new Date(this.startedAt as string);
      const dateFinishedAt = new Date(this.finishedAt);

      this.duration =
        ((dateFinishedAt.getTime() - dateStartedAt.getTime()) as number) / 1000;
    }

    if (error) {
      throw error;
    }

    return this.getInfo();
  }

  getInfo() {
    return Object.fromEntries(
      [
        'name',
        'status',
        'result',
        'data',
        'createdAt',
        'startedAt',
        'finishedAt',
        'duration',
        'error',
      ].map(item => [item, this[item]]),
    ) as IInitializationTask;
  }
}
