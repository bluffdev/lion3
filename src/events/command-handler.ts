import { AutocompleteInteraction, CacheType, CommandInteraction } from 'discord.js';
import { Command } from '../commands/command';
import { EventHandler } from './';
import { findCommand } from '../utils';

export class CommandHandler implements EventHandler {
  constructor(public commands: Command[]) {}

  public async process(intr: CommandInteraction | AutocompleteInteraction): Promise<void> {
    let command = findCommand(this.commands, [intr.commandName]);
    try {
      command.execute(intr as CommandInteraction<CacheType>);
    } catch (err) {
      console.error('Error executing command', err);
    }
  }
}
