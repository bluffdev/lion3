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

export default class UnRegisterCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'unregister';
  public description = 'Unregister from a class';
  public dmPermission = false;
  public channels = [Channels.Bot.BotCommands];
  public options = [
    {
      name: 'class',
      description: 'Enter class to unregister from',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
  ];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const className = interaction.options.getString('class');

    const request = classService.buildRequest(interaction.user, [className]);

    if (!request) {
      Logger.error('Error building request for register command');
    }

    try {
      const response = await classService.unregister(request);

      if (response) {
        await reply(interaction, `Unregistered for ${className}`);
      } else {
        await reply(interaction, `You are not registered in ${className}`);
      }
    } catch (error) {
      Logger.error('Failed to execute unregister command', error);
    }
  }
}
