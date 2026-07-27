import { IRouter, Logger } from '../../../../src/core/server';
import { registerChatRoutes } from './chat';
import { registerSettingsRoutes } from './settings';
import { registerConversationRoutes } from './conversations';

export function registerRoutes(router: IRouter, logger: Logger): void {
  registerChatRoutes(router, logger);
  registerSettingsRoutes(router, logger);
  registerConversationRoutes(router, logger);
}
