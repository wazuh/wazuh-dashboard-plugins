import { App } from '../../../../src/core/public';

export interface AppOperations {
  beforeMount?: () => Partial<App>;
  cleanup?: () => Partial<App>;
}
