import {
  ILegacyClusterClient,
} from "../../../../../../src/core/server";
import { defaultChannelConfigs, ChannelDefinition, defaultChannels } from "../common/constants";
type InitializationTaskRunContext = any;

export const verifyOrCreateNotificationChannel = (client: ILegacyClusterClient): Record<string, any> => {
  const taskName = 'notification-channel:verify-default-channels';

  const verifyExistingDefaultChannels = async (client: ILegacyClusterClient, ctx: InitializationTaskRunContext): Promise<ChannelDefinition[]> => {
    // Get all existing notification configs/channels
    const results = await client.callAsInternalUser('notifications.getConfigs');
    console.log('Results:::', results.config_list);

    ctx.logger.debug('Notification channels API response:', results);

    // Handle case where notifications plugin is not available
    if (!results.config_list && !results.configs) {
      const message = 'Notifications plugin is not available or no config endpoint found';
      ctx.logger.error(message);
      throw new Error(message);
    }

    // Get the configs channels list
    const existingConfigs = results.config_list || [];

    // Find which default channels exist
    const existingChannelIds = existingConfigs.map((config: any) => config.config_id);
    const defaultChannelsFound = defaultChannels.filter(channel =>
      existingChannelIds.includes(channel.id)
    );

    if (defaultChannelsFound.length > 0) {
      const foundChannelNames = defaultChannelsFound.map(ch => ch.name).join(', ');
      ctx.logger.debug(`Existing channels: ${foundChannelNames}`);
    } else {
      ctx.logger.info('No existing Wazuh default notification channels found');
    }
    return defaultChannelsFound;
  };

  const createMissingChannels = async (missingChannels: ChannelDefinition[], client: ILegacyClusterClient, ctx: InitializationTaskRunContext): Promise<string[]> => {
    let createdChannels: string[] = [];
    ctx.logger.debug(`Creating ${missingChannels.length} missing notification channels`);

    // Create each missing channel
    for (const channel of missingChannels) {
      try {
        ctx.logger.debug(`Creating notification channel: ${channel.name}`);

        const channelPayload = {
          config_id: channel.id,
          config: defaultChannelConfigs[channel.name]
        };

        const createResult = await client.callAsInternalUser('notifications.createConfig', { body: channelPayload });

        if (createResult && (createResult.config_id === channel.id || createResult.id === channel.id)) {
          createdChannels.push(channel.name);
        } else {
          ctx.logger.warn(`Channel creation returned unexpected result for ${channel.name}:`, createResult);
        }

      } catch (createError: any) {
        ctx.logger.error(`Failed to create notification channel ${channel.name}: ${createError.message}`);
      }
    }
    ctx.logger.info(`Created ${createdChannels.length} notification channels: ${createdChannels.join(', ')}`);
    return createdChannels;
  }

  return {
    name: taskName,
    async run(ctx: InitializationTaskRunContext) {
      try {
        ctx.logger.info('Starting verification of default notification channels');

        const defaultChannelsFound = await verifyExistingDefaultChannels(client, ctx);
        const missingChannels = defaultChannels.filter(channel =>
          !defaultChannelsFound.some(found => found.id === channel.id)
        );
        let createdChannels: string[] = [];

        if (missingChannels.length) {
          createdChannels = await createMissingChannels(missingChannels, client, ctx);
        }

        const totalDefaultChannelsFound = defaultChannelsFound.length + createdChannels.length;
        const allChannelsPresent = totalDefaultChannelsFound === defaultChannels.length;

        if (allChannelsPresent) {
          ctx.logger.info('All default notification channels are now present and verified');
        } else {
          const stillMissing = defaultChannels.length - totalDefaultChannelsFound;
          ctx.logger.warn(`${stillMissing} notification channels are still missing after creation attempts`);
        }

        return;
      } catch (error: any) {
        const message = `Error verifying or creating default notification channels: ${error.message}`;
        ctx.logger.error(message);
        throw new Error(message);
      }
    },
  };
}
