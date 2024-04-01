import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';

export function createMockPlatformServer(context) {
  const loggingService = loggingSystemMock.create();
  const logger = loggingService.get();

  let server, innerServer;

  const enhanceWithContext = (fn: (...args: any[]) => any) =>
    fn.bind(null, context);

  async function start(registerRoutes: (router) => void) {
    // Create server
    const config = {
      name: 'plugin_platform',
      host: '127.0.0.1',
      maxPayload: new ByteSizeValue(1024),
      port: 10002,
      ssl: { enabled: false },
      compression: { enabled: true },
      requestId: {
        allowFromAnyIp: true,
        ipAllowlist: [],
      },
    } as any;
    server = new HttpServer(loggingService, 'tests');
    const router = new Router('', logger, enhanceWithContext);
    const {
      registerRouter,
      server: innerServerTest,
      ...rest
    } = await server.setup(config);
    innerServer = innerServerTest;

    // Register routes
    registerRoutes(router);

    // Register router
    registerRouter(router);

    // start server
    await server.start();
  }

  async function stop() {
    // Stop server
    await server.stop();
  }

  function getServerListener() {
    return innerServer.listener;
  }
  return {
    start,
    stop,
    getServerListener,
  };
}
