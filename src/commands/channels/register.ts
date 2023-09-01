import {
  APIApplicationCommandOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChatInputCommandInteraction,
} from 'discord.js';
import { Command } from '../command';
import { Channels } from '../../constants';
import { classService } from '../../services';
import { reply } from '../../utils';

export default class RegisterCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'register';
  public description = 'Register for a class';
  public dmPermission = false;
  public channels = [Channels.Bot.BotCommands];
  public options = [
    {
      name: 'classes',
      description: 'Enter the classes that you want to register for',
      type: ApplicationCommandOptionType.String,
      required: true,
    } as APIApplicationCommandOption,
  ];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const classes = interaction.options.getString('classes');

    if (!classes) {
      await reply(interaction, `Failed to execute ${this.name} command`);
      return;
    }

    const classNames = classes?.split(' ');

    classNames.map(async className => {
      const request = classService.buildRequest(interaction.user, [className]);

      if (!request) {
        return;
      }

      try {
        await classService.register(request);
      } catch (error) {
        await reply(interaction, `There was an error registering for ${className}`, true);
        return;
      }
    });

    await reply(interaction, 'Registered for classes');
  }
}
