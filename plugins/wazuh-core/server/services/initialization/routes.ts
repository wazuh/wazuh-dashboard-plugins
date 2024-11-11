import { schema } from '@osd/config-schema';

export function addRoutes(router, { initialization }) {
  const getTaskList = (tasksAsString: string) => tasksAsString.split(',');

  const validateTaskList = schema.maybe(
    schema.string({
      validate(value: string) {
        const tasks = initialization.get();
        const requestTasks = getTaskList(value);
        const invalidTasks = requestTasks.filter(requestTask =>
          tasks.every(({ name }) => requestTask !== name),
        );
        if (invalidTasks.length) {
          return `Invalid tasks: ${invalidTasks.join(', ')}`;
        }
        return undefined;
      },
    }),
  );

  const apiEndpointBase = '/api/initialization';

  // Get the status of internal initialization tasks
  router.get(
    {
      path: `${apiEndpointBase}/internal`,
      validate: {
        tasks: schema.object({
          tasks: validateTaskList,
        }),
      },
    },
    async (context, request, response) => {
      try {
        const tasksNames = request.query.tasks
          ? getTaskList(request.query.tasks)
          : undefined;
        const logger = context.wazuh_core.logger;
        logger.debug(`Getting initialization tasks related to internal scope`);
        const tasks = tasksNames
          ? tasksNames.map(taskName =>
              context.wazuh_core.initialization.get(taskName),
            )
          : context.wazuh_core.initialization.get();

        const tasksData = tasks.map(task => task.getInfo());

        logger.debug(
          `Initialzation tasks related to internal scope: [${[...tasksData]
            .map(({ name }) => name)
            .join(', ')}]`,
        );

        return response.ok({
          body: {
            message: `All initialization tasks are returned: ${tasks
              .map(({ name }) => name)
              .join(', ')}`,
            tasks: tasksData,
          },
        });
      } catch (e) {
        return response.internalError({
          body: {
            message: `Error getting the internal initialization tasks: ${e.message}`,
          },
        });
      }
    },
  );

  // Run the internal initialization tasks
  // TODO: protect with administrator privilegies
  router.post(
    {
      path: `${apiEndpointBase}/internal`,
      validate: {
        query: schema.object({
          tasks: validateTaskList,
        }),
      },
    },
    async (context, request, response) => {
      try {
        const tasksNames = request.query.tasks
          ? getTaskList(request.query.tasks)
          : undefined;
        const logger = context.wazuh_core.logger;

        logger.debug(`Running initialization tasks related to internal scope`);
        const results = await context.wazuh_core.initialization.runAsInternal(
          tasksNames,
        );
        logger.info(
          `Initialization tasks related to internal scope were executed`,
        );

        return response.ok({
          body: {
            message: `All initialization tasks are returned: ${results
              .map(({ name }) => name)
              .join(', ')}`,
            tasks: results,
          },
        });
      } catch (e) {
        return response.internalError({
          body: {
            message: `Error running the internal initialization tasks: ${e.message}`,
          },
        });
      }
    },
  );

  router.post(
    {
      path: `${apiEndpointBase}/user`,
      validate: {
        // TODO: restrict to user tasks
        query: schema.object({
          tasks: validateTaskList,
        }),
      },
    },
    async (context, request, response) => {
      try {
        const tasksNames = request.query.tasks
          ? getTaskList(request.query.tasks)
          : undefined;
        const logger = context.wazuh_core.logger;
        const username = ''; // TODO: get value
        const scope = 'user';
        logger.debug(
          `Getting initialization tasks related to user [${username}] scope [${scope}]`,
        );
        const initializationTasks = context.wazuh_core.initialization.get();

        const indexPatternTasks = initializationTasks
          .filter(({ name }) => name.startsWith('index-pattern:'))
          .map(({ name }) =>
            context.wazuh_core.initialization.createNewTaskFromRegisteredTask(
              name,
            ),
          );
        const settingsTasks = initializationTasks
          .filter(({ name }) => name.startsWith('setting:'))
          .map(({ name }) =>
            context.wazuh_core.initialization.createNewTaskFromRegisteredTask(
              name,
            ),
          );

        const allUserTasks = [...indexPatternTasks, ...settingsTasks];
        const tasks = tasksNames
          ? allUserTasks.filter(({ name }) =>
              tasksNames.some(taskName => taskName === name),
            )
          : allUserTasks;

        logger.debug(
          `Initialzation tasks related to user [${username}] scope [${scope}]: [${tasks
            .map(({ name }) => name)
            .join(', ')}]`,
        );

        const taskContext = context.wazuh_core.initialization.createRunContext(
          'user',
          { core: context.core, request },
        );

        logger.debug(`Running tasks for user [${username}] scope [${scope}]`);
        const results = await Promise.all(
          tasks.map(async task => {
            const taskLogger = enhanceTaskLogger(logger);
            let data;
            try {
              data = await task.run({
                ...taskContext,
                // TODO: use user selection index patterns
                logger: taskLogger,
                ...(task.name.includes('index-pattern:')
                  ? {
                      getIndexPatternID: () =>
                        task.name /* TODO: use request parameters/body/cookies */,
                    }
                  : {}),
              });
            } catch (e) {
            } finally {
              return {
                logs: taskLogger.getLogs(),
                ...task.getInfo(),
              };
            }
          }),
        );

        logger.debug(`All tasks for user [${username}] scope [${scope}] run`);

        const initialMessage =
          'All the initialization tasks related to user scope were executed.';

        const message = [
          initialMessage,
          results.some(({ error }) => error) && 'There was some errors.',
        ]
          .filter(v => v)
          .join(' ');

        return response.ok({
          body: {
            message,
            tasks: results,
          },
        });
      } catch (e) {
        return response.internalError({
          body: {
            message: `Error initializating the tasks: ${e.message}`,
          },
        });
      }
    },
  );
}

function enhanceTaskLogger(logger) {
  const logs = [];

  return ['debug', 'info', 'warn', 'error'].reduce(
    (accum, level) => ({
      ...accum,
      [level]: message => {
        logs.push({ timestamp: new Date().toISOString(), level, message });
        logger[level].message;
      },
    }),
    { getLogs: () => logs },
  );
}
