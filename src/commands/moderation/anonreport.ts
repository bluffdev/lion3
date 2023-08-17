import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../command';
import { Logger, replyWithEmbed } from '../../utils';
import { moderationService } from '../../services';
import { Channels } from '../../constants';

export default class AnonReportCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'anonreport';
  public description = 'Sends an anonymous report to server moderators';
  public dmPermission = true;
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

    try {
      await replyWithEmbed(
        interaction,
        messageEmbed.setTitle('Your report has been recorded'),
        interaction.channel.name === Channels.Bot.BotCommands
      );
    } catch (error) {
      Logger.error('Failed to send reply for anonreport command', error);
    }
  }
}
