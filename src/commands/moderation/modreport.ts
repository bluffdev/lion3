import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '..';
import { Logger, reply, UserReport } from '../../utils';
import { CommandDeferType } from '../command';
import { guildService, moderationService } from '../../services';
import { channels } from '../../constants';

export class ModReportCommand implements Command {
  public name = 'modreport';
  public channels = [channels.staff.modCommands];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: [];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getString('tag');
    const issueWarn = interaction.options.getBoolean('warn');
    const description = interaction.options.getString('description');
    const attachment = interaction.options.getAttachment('screenshot', false);

    if (!attachment) {
      Logger.error('Attachment is undefined');
      return;
    }

    const member = (await guildService.get().members.fetch()).find(
      member => member.displayName === user
    );

    if (!member) {
      await reply(interaction, 'Member not found');
      return;
    }

    try {
      const newReport = new UserReport(guildService.get(), member.id, description, attachment.url);

      if (!newReport) {
        await reply(interaction, 'Error creating report');
      }

      if (issueWarn) {
        await reply(interaction, await moderationService.fileWarning(newReport));
      } else {
        await reply(interaction, await moderationService.fileReport(newReport));
      }
    } catch (error) {
      Logger.error('Failed to execute modreport command', error);
    }
  }
}
