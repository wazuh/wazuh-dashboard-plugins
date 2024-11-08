import { LifecycleService } from '../types';

export interface InitializationTaskRunData {
  status: 'not_started' | 'running' | 'finished';
  result: 'success' | 'fail' | null;
  startAt: number | null;
  endAt: number | null;
  duration: number | null;
  data: any;
  error: string | null;
}

export interface InitializationTaskDefinition {
  name: string;
  run: (ctx: any) => any;
}

export interface IInitializationService
  extends LifecycleService<any, any, any, any, any, any> {}
