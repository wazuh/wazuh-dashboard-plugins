# InitializationService

The `InitializationService` provides a mechanism to register and run tasks when the `wazuhCore` plugin starts (plugin lifecycle).

Other plugins can register tasks in the plugin `setup` lifecycle that will be run on the `wazuhCore` plugin starts.

The tasks run on parallel.

Optionally the registered tasks could be retrieved to run in API endpoints or getting information about its status.

# InitializationService tasks

A task can be defined with:

```ts
interface InitializationTaskDefinition {
  name: string;
  run: (ctx: any) => any;
}
```

The `ctx` is the context of the task execution and includes core services and task context services or dependencies.

The `name` is used to identify the task and this is rendered in the context logger.

For example, in the server log:

```
server    log   [11:57:39.648] [info][index-pattern-vulnerabilities-states][initialization][plugins][wazuhCore] Index pattern with ID [wazuh-states-vulnerabilities-*] does not exist

```

the task name is `index-pattern-vulnerabilities-states`.

## Register a task

```ts
// plugin setup
setup(){

  // Register a task
  plugins.wazuhCore.register({
    name: 'custom-task',
    run: (ctx) => {
      console.log('Run from wazuhCore starts' )
    }
  });

}
```

## Task data

The task has the following data related to the execution:

```ts
interface InitializationTaskRunData {
  status: 'not_started' | 'running' | 'finished';
  result: 'success' | 'fail';
  startAt: number | null;
  endAt: number | null;
  duration: number | null;
  data: any;
  error: string | null;
}
```
