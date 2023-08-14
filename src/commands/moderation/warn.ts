import { ChatInputCommandInteraction } from 'discord.js';
import { Command, CommandDeferType } from '../command';
import { Logger, reply, UserReport } from '../../utils';
import { guildService, moderationService } from '../../services';
import { channels } from '../../constants';

export class WarnCommand implements Command {
  public name = 'warn';
  public channels = [channels.staff.modCommands];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: ['Administrator'];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const user = interaction.options.getString('tag');
    const description = interaction.options.getString('description');
    const member = (await guildService.get().members.fetch()).find(
      member => member.displayName === user
    );

    if (!member) {
      await reply(interaction, 'Member not found');
      return;
    }

    try {
      this.handleIssueWarning(interaction, user, description);
    } catch (error) {
      Logger.error('Failed to execute modreport command', error);
    }
  }

  private createReport(id: string, description?: string): UserReport {
    return new UserReport(guildService.get(), id, description);
  }

  private async handleIssueWarning(
    interaction: ChatInputCommandInteraction,
    id: string,
    description?: string
  ): Promise<void> {
    const rep = this.createReport(id, description);
    if (!rep) {
      await interaction.reply('Error creating report');
      return;
    }

    await reply(interaction, await moderationService.fileWarning(rep));
  }
}
