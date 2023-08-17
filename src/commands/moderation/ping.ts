import { ApplicationCommandType, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../command';
import { Logger, reply } from '../../utils';

export default class PingCommand implements Command {
  public type = ApplicationCommandType.ChatInput;
  public name = 'ping';
  public description = 'Replies with Pong!';
  public dmPermission = false;
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await reply(interaction, 'Pong!');
    } catch (error) {
      Logger.error('Failed to execute ping command', error);
    }
  }
}
