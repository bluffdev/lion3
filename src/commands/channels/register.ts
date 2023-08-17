import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../command';
import { Logger, reply } from '../../utils';
import { Channels } from '../../constants';
import { classService } from '../../services';

export default class RegisterCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'register';
  public description = 'Register for a class';
  public dmPermission = false;
  public channels = [Channels.Bot.BotCommands];
  public options = [
    {
      name: 'class',
      description: 'Enter class to register for',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
  ];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const className = interaction.options.getString('class');

    if (!className) {
      Logger.error('Error retrieving class name option');
      await reply(interaction, `Failed to execute ${this.name} command`);
      return;
    }

    const request = classService.buildRequest(interaction.user, [className]);

    if (!request) {
      Logger.error('Error building request for register command');
      await reply(interaction, `Failed to execute ${this.name} command`);
      return;
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
