export type CheckLog = (message: string) => void;

export interface CheckLogger {
  info: CheckLog
  error: CheckLog
  action: CheckLog
};
