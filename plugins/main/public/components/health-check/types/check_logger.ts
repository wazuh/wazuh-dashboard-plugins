export type CheckLog = (message: string) => void;

export interface CheckLogger {
  info: CheckLog;
  warning: CheckLog;
  error: CheckLog;
  action: CheckLog;
}
