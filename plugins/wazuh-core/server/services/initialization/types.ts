import { LifecycleService } from '../types';

export interface InitializationTaskDefinition {
  name: string;
  run: (ctx: any) => any;
}

export interface InitializationTaskRunData {
  name: InitializationTaskDefinition['name'];
  status: 'not_started' | 'running' | 'finished';
  result: 'success' | 'fail' | null;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null; // seconds
  data: any;
  error: string | null;
}

export interface IInitializationTask extends InitializationTaskRunData {
  run(ctx: any): Promise<any>;
  getInfo(): InitializationTaskRunData;
}

export type InitializationTaskContext = 'internal' | 'user';
export interface IInitializationService
  extends LifecycleService<any, any, any, any, any, any> {
  register(task: InitializationTaskDefinition): void;
  get(
    taskName?: string,
  ): InitializationTaskRunData | InitializationTaskRunData[];
  createRunContext(
    scope: InitializationTaskContext,
    context: any,
  ): {
    scope: InitializationTaskContext;
  };
  runAsInternal(tasks?: string[]): Promise<any>;
}
