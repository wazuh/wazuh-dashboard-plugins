export interface LifecycleService<
  SetupDeps,
  SetupReturn,
  StartDeps,
  StartReturn,
  StopDeps,
  StopReturn,
> {
  setup: (deps: SetupDeps) => SetupReturn;
  start: (deps: StartDeps) => StartReturn;
  stop: (deps: StopDeps) => StopReturn;
}
