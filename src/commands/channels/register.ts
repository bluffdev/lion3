import { ChatInputCommandInteraction } from 'discord.js';
import { Command, CommandDeferType } from '../command';
import { Logger, reply } from '../../utils';
import { Channels } from '../../constants';
import { classService } from '../../services';

export class RegisterCommand implements Command {
  public name = 'register';
  public channels = [Channels.Bot.BotCommands];
  public deferType = CommandDeferType.HIDDEN;
  public requireClientPerms = [];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const className = interaction.options.getString('class');

    const request = classService.buildRequest(interaction.user, [className]);

    if (!request) {
      Logger.error('Error building request for register command');
    }

    try {
      const response = await classService.register(request);

      if (response) {
        await reply(interaction, `Registered for ${className}`);
      } else {
        await reply(interaction, `You are already registered in ${className}`);
      }
    } catch (error) {
      Logger.error('Failed to execute register command', error);
    }
  }
}
