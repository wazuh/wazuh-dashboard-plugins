# InitializationService

The `InitializationService` provides a mechanism to register and run tasks when the `wazuhCore` plugin starts (plugin lifecycle).

Other plugins can register tasks in the plugin `setup` lifecycle that will be run on the `wazuhCore` plugin starts.

The tasks run on parallel.

Optionally the registered tasks could be retrieved to run in API endpoints or getting information about its status.

There are 2 scopes:

- `internal`: run through the internal user
  - on plugin starts
  - on demand
- `user`: run through the logged (requester) user
  - on demand

The scopes can be used to get a specific context (clients, parameters) that is set in the `scope` property of the task context.

The `internal` scoped tasks keep the same execution data (see [Task execution data](#task-execution-data)), and the `user` scoped task are newly created on demand.

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

## Task name convention

- lowercase
- kebab case (`word1-word2`)
- use colon ( `:` ) for tasks related to some entity that have different subentities.

```
entity_identifier:entity_specific
```

For example:

```
index-pattern:alerts
index-pattern:statistics
index-pattern:vulnerabilities-states
```

## Register a task

```ts
// plugin setup
setup(){

  // Register a task
  plugins.wazuhCore.initialization.register({
    name: 'custom-task',
    run: (ctx) => {
      console.log('Run from wazuhCore starts' )
    }
  });

}
```

## Task execution data

The task has the following data related to the execution:

```ts
interface InitializationTaskRunData {
  name: string;
  status: 'not_started' | 'running' | 'finished';
  result: 'success' | 'fail';
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  duration: number | null; // seconds
  data: any;
  error: string | null;
}
```

## Create a task instance

This is used to create the user scoped tasks.

```ts
const newTask =
  context.wazuh_core.initialization.createNewTaskFromRegisteredTask(
    'example-task',
  );
```
