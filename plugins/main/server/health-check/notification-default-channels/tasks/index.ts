import { ILegacyClusterClient } from '../../../../../../src/core/server';
import { ChannelDefinition, defaultChannels } from '../common/constants';
import type { InitializationTaskRunContext } from '../../types';

const verifyExistingDefaultChannels = async (
  client: ILegacyClusterClient,
  ctx: InitializationTaskRunContext,
): Promise<ChannelDefinition[]> => {
  // Get all existing notification configs/channels
  const results = await client.callAsInternalUser('notifications.getConfigs');

  ctx.logger.debug('Notification channels API response:', results);

  // Handle case where notifications plugin is not available
  if (!results.config_list) {
    const message =
      'Notifications plugin is not available or no config endpoint found';
    ctx.logger.error(message);
    throw new Error(message);
  }

  // Find which default channels exist
  const existingConfigs = results.config_list || [];
  const existingChannelIds = existingConfigs.map(
    (config: any) => config.config_id,
  );
  const defaultChannelsFound = defaultChannels.filter(channel =>
    existingChannelIds.includes(channel.id),
  );

  if (defaultChannelsFound.length > 0) {
    const foundChannelNames = defaultChannelsFound
      .map(ch => ch.name)
      .join(', ');
    ctx.logger.debug(`Existing channels: ${foundChannelNames}`);
  } else {
    ctx.logger.info('No existing Wazuh default notification channels found');
  }
  return defaultChannelsFound;
};

export const initializeDefaultNotificationChannel = (
  client: ILegacyClusterClient,
): Record<string, any> => {
  return {
    name: 'integrations:default-notifications-channels',
    async run(ctx: InitializationTaskRunContext) {
      try {
        ctx.logger.info(
          'Starting verification of default notification channels',
        );

        const defaultChannelsFound = await verifyExistingDefaultChannels(
          client,
          ctx,
        );

        const allChannelsPresent =
          defaultChannelsFound.length === defaultChannels.length;

        if (allChannelsPresent) {
          ctx.logger.info(
            'All default notification channels are present and verified',
          );
        } else {
          const stillMissing =
            defaultChannels.length - defaultChannelsFound.length;
          ctx.logger.warn(
            `${stillMissing} default notification channels are missing`,
          );
        }
      } catch (error: any) {
        const message = `Error verifying default notification channels: ${error.message}`;
        ctx.logger.error(message);
        throw new Error(message);
      }
    },
  };
};
