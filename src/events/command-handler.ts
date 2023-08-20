import {
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  CommandInteraction,
  TextChannel,
} from 'discord.js';
import { EventHandler } from './';
import { findCommand, Logger, reply } from '../utils';
import { Channels } from '../constants';
import { clientService } from '../services';

export class CommandHandler implements EventHandler {
  public async process(intr: CommandInteraction | AutocompleteInteraction): Promise<void> {
    let command = findCommand(clientService.commands, [intr.commandName]);

    if (!command) {
      Logger.error(`Add command to commands array ${intr.commandName}`);
      await reply(
        intr as ChatInputCommandInteraction,
        'This command is not listed in the commands array',
        true
      );
      return;
    }

    if (command.name === 'anonreport' && intr.channel instanceof TextChannel) {
      if (intr.channel.name !== Channels.Bot.BotCommands) {
        await reply(
          intr as ChatInputCommandInteraction,
          'This command can only be used in DMs with Lion',
          true
        );
        return;
      }
    }

    const allowedChannels = command.channels;

    if (allowedChannels && intr.channel instanceof TextChannel) {
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

    const commandEvent: { status: string; commandName: string; user: string } = {
      status: 'starting',
      commandName: command.name,
      user: intr.user.username,
    };

    try {
      await command.execute(intr as CommandInteraction<CacheType>);
      Logger.info(JSON.stringify(commandEvent));
    } catch (error) {
      commandEvent.status = 'error';
      Logger.error(JSON.stringify(commandEvent), error);
    }
  }
}
