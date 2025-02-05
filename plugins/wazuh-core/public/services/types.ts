export interface LifecycleService<
  SetupDeps = any,
  SetupReturn = any,
  StartDeps = any,
  StartReturn = any,
  StopDeps = any,
  StopReturn = any,
> {
  setup: (deps?: SetupDeps) => SetupReturn;
  start: (deps?: StartDeps) => StartReturn;
  stop: (deps?: StopDeps) => StopReturn;
}
