import { ChatInputCommandInteraction } from 'discord.js';
import { Command, CommandDeferType } from '../command';
import { Logger, reply } from '../../utils';

export class PingCommand implements Command {
  public name = 'ping';
  public deferType = CommandDeferType.HIDDEN;
  public requireClientPerms = [];
  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await reply(interaction, 'Pong!');
    } catch (error) {
      Logger.error('Failed to execute ping command', error);
    }
  }
}
