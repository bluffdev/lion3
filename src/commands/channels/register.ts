import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../command';
import { reply } from '../../utils';
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
      await reply(interaction, `Failed to execute ${this.name} command`);
      return;
    }

    const request = classService.buildRequest(interaction.user, [className]);

    if (!request) {
      await reply(interaction, `Failed to execute ${this.name} command`);
      return;
    }

    try {
      const response = await classService.register(request);

      if (response) {
        await reply(interaction, `Registered for ${className}`), true;
      } else {
        await reply(interaction, `You are already registered in ${className}`, true);
      }
    } catch (error) {
      await reply(interaction, `There was an error registering for ${className}`, true);
    }
  }
}
