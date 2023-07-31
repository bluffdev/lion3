import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  CommandInteraction,
} from 'discord.js';
import { Command } from '../commands/command';
import { EventHandler } from './';
import { findCommand, Logger, reply } from '../utils';

export class CommandHandler implements EventHandler {
  constructor(public commands: Command[]) {}

  public async process(intr: CommandInteraction | AutocompleteInteraction): Promise<void> {
    let command = findCommand(this.commands, [intr.commandName]);

    const allowedChannels = command.channels;

    if (allowedChannels) {
      const channel = intr.channel.name;
      if (!allowedChannels.includes(channel)) {
        await reply(
          intr as ChatInputCommandInteraction,
          `This command is only allowed in these channels: ${allowedChannels}`,
          true
        );
        return;
      }
    }

    try {
      command.execute(intr as CommandInteraction<CacheType>);
      Logger.info(`Executed ${command.name} command`);
    } catch (error) {
      console.error('Error executing command', error);
    }
  }
}
