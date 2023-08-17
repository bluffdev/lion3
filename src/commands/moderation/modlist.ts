import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Command } from '..';
import { Logger, reply, replyWithEmbed } from '../../utils';
import { guildService, moderationService } from '../../services';
import { Channels, moderator, Roles } from '../../constants';

export default class ModListCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'modlist';
  public description = 'Sends moderation reports for a user;';
  public dmPermission = false;
  public defaultMemberPermissions = moderator;
  public channels = [Channels.Staff.ModCommands];
  public options = [
    {
      name: 'tag',
      description: 'Discord user tag',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
  ];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getString('tag');

    const member = (await guildService.get().members.fetch()).find(
      member => member.displayName === user
    );

    if (!member) {
      await reply(interaction, 'Member not found');
      return;
    }

    if (member.user.bot) {
      await reply(interaction, 'You cannot use this command on a bot');
      return;
    }

    if (
      member.roles.cache.find(role => role.name === Roles.Moderator || role.name === Roles.Admin)
    ) {
      await reply(interaction, 'You cannot use this command on a moderator');
      return;
    }

    try {
      const list = await moderationService.getModerationSummary(guildService.get(), member);

      if (typeof list === 'string') {
        await reply(interaction, list);
      } else if (list instanceof EmbedBuilder) {
        await replyWithEmbed(interaction, list);
      } else {
        await reply(interaction, 'Error with reply :(');
        Logger.error('Incorrect type in reply for list command');
      }
    } catch (error) {
      Logger.error('Failed to execute modlist command', error);
    }
  }
}
