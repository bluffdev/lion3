import { ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../';
import { Logger, reply, UserReport } from '../../utils';
import { CommandDeferType } from '../command';
import { guildService, moderationService } from '../../services';
import { channels } from '../../constants';

export class ReportCommand implements Command {
  public name = 'report';
  public channels = [channels.staff.modCommands];
  public deferType = CommandDeferType.PUBLIC;
  public requireClientPerms: ['Administrator'];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const tag = interaction.options.getString('tag');
    const description = interaction.options.getString('description');

    try {
      this.handleAddReport(interaction, tag, description);
    } catch (error) {
      Logger.error('Failed to execute modreport command', error);
    }
  }

  private createReport(id: string, description?: string): UserReport {
    return new UserReport(guildService.get(), id, description);
  }

  private async handleAddReport(
    interaction: ChatInputCommandInteraction,
    id: string,
    description?: string
  ): Promise<void> {
    const report = this.createReport(id, description);
    if (!report) {
      await reply(interaction, 'The report failed');
    }

    await reply(interaction, await moderationService.fileReport(report));
  }
}
