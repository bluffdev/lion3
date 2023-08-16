import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '..';
import { Logger, reply, replyWithEmbed, UserReport } from '../../utils';
import { CommandDeferType } from '../command';
import { guildService, moderationService } from '../../services';
import { Channels, Roles } from '../../constants';

export class ModReportCommand implements Command {
  public name = 'modreport';
  public channels = [Channels.Staff.ModCommands];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: [];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getString('tag');
    const issueWarn = interaction.options.getBoolean('warn');
    const description = interaction.options.getString('description');
    const attachment = interaction.options.getAttachment('screenshot', false);

    const member = (await guildService.get().members.fetch()).find(
      member => member.displayName === user
    );

    if (!member) {
      await reply(interaction, 'Member not found');
      return;
    }

    if (member.user.bot) {
      await reply(interaction, 'You cannot report a bot');
      return;
    }

    if (
      member.roles.cache.find(role => role.name === Roles.Moderator || role.name === Roles.Admin)
    ) {
      await reply(interaction, 'You cannot report a moderator');
      return;
    }

    try {
      const newReport = new UserReport(
        guildService.get(),
        member.id,
        description,
        attachment ? attachment.url : undefined
      );

      if (!newReport) {
        await reply(interaction, 'Error creating report');
      }

      if (issueWarn) {
        await replyWithEmbed(interaction, await moderationService.fileWarning(newReport));
      } else {
        await replyWithEmbed(interaction, await moderationService.fileReport(newReport));
      }
    } catch (error) {
      Logger.error('Failed to execute modreport command', error);
    }
  }
}
