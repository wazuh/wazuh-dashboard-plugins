import {
  InitializationTaskRunResult,
  InitializationTaskRunStatus,
} from '../../../common/services/initialization/types';
import { LifecycleService } from '../types';

export interface InitializationTaskDefinition {
  name: string;
  run: (ctx: any) => any;
}

export interface InitializationTaskRunData {
  name: InitializationTaskDefinition['name'];
  status: InitializationTaskRunStatus;
  result: InitializationTaskRunResult;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null; // seconds
  data: any;
  error: string | null;
}

export interface IInitializationTask extends InitializationTaskRunData {
  run<Context = any, Result = any>(ctx: Context): Promise<Result>;
  getInfo(): InitializationTaskRunData;
}

export type InitializationTaskContext = 'internal' | 'user';
export interface IInitializationService
  extends LifecycleService<any, any, any, any, any, any> {
  register(task: InitializationTaskDefinition): void;
  get(taskName: string): InitializationTaskRunData;
  getAll(): InitializationTaskRunData[];
  createRunContext<ContextType = any>(
    scope: InitializationTaskContext,
    context: ContextType,
  ): {
    scope: InitializationTaskContext;
  };
  runAsInternal<ReturnType = any>(tasks?: string[]): Promise<ReturnType>;
}
