import {
  InitializationTaskDefinition,
  InitializationTaskRunData,
  IInitializationTask,
} from '../types';
import {
  INITIALIZATION_TASK_RUN_RESULT_FAIL,
  INITIALIZATION_TASK_RUN_RESULT_NULL,
  INITIALIZATION_TASK_RUN_RESULT_SUCCESS,
  INITIALIZATION_TASK_RUN_STATUS_FINISHED,
  INITIALIZATION_TASK_RUN_STATUS_NOT_STARTED,
  INITIALIZATION_TASK_RUN_STATUS_RUNNING,
} from '../../../../common/services/initialization/constants';

export class InitializationTask implements IInitializationTask {
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
