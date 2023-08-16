import { ChatInputCommandInteraction } from 'discord.js';
import { Command, CommandDeferType } from '../command';
import { replyWithEmbed } from '../../utils';
import { moderationService } from '../../services';
import { Channels } from '../../constants';

export class AnonReportCommand implements Command {
  name = 'anonreport';
  deferType = CommandDeferType.PUBLIC;
  requireClientPerms = [];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const anonymous = interaction.options.getBoolean('anonymous');
    const description = interaction.options.getString('description');
    const screenshot = interaction.options.getAttachment('screenshot');

    const messageEmbed = await moderationService.fileAnonReport(
      interaction.user,
      anonymous,
      description,
      screenshot
    );
    await replyWithEmbed(
      interaction,
      messageEmbed.setTitle('Your report has been recorded'),
      interaction.channel.name === Channels.Bot.BotCommands
    );
  }
}
