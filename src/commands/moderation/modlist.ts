import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '..';
import { Logger, reply, replyWithEmbed } from '../../utils';
import { CommandDeferType } from '../command';
import { guildService, moderationService } from '../../services';
import { Channels, Roles } from '../../constants';

export class ModListCommand implements Command {
  public name = 'modlist';
  public channels = [Channels.Staff.ModCommands];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: [];
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
