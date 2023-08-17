import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js';
import { Command } from '../command';
import { Logger, reply, replyWithEmbed } from '../../utils';
import { moderationService } from '../../services';
import { Channels } from '../../constants';

export default class AnonReportCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'anonreport';
  public description = 'Sends an anonymous report to server moderators';
  public dmPermission = true;
  public options = [
    {
      name: 'anonymous',
      description: 'Select true if you do not want lion to log your user id',
      type: ApplicationCommandOptionType.Boolean,
      required: true,
    } as APIApplicationCommandOption,
    {
      name: 'description',
      description: 'Reason for report',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
    {
      name: 'screenshot',
      description: 'Screenshot of offense',
      type: ApplicationCommandOptionType.Attachment,
      required: false,
    } as APIApplicationCommandOption,
  ];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const anonymous = interaction.options.getBoolean('anonymous');
    const description = interaction.options.getString('description');
    const screenshot = interaction.options.getAttachment('screenshot');

    if (!anonymous || !description || screenshot === null) {
      Logger.error('Error with options');
      await reply(interaction, `Failed to execute ${this.name} command`);
      return;
    }

    const messageEmbed = await moderationService.fileAnonReport(
      interaction.user,
      anonymous,
      description,
      screenshot
    );

    try {
      let hidden = false;

      if (interaction.channel instanceof TextChannel) {
        hidden = interaction.channel.name === Channels.Bot.BotCommands;
      }

      await replyWithEmbed(
        interaction,
        messageEmbed.setTitle('Your report has been recorded'),
        hidden
      );
    } catch (error) {
      Logger.error('Failed to send reply for anonreport command', error);
    }
  }
}
