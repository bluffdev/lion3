import {
  ApplicationCommandType,
  REST,
  RESTGetAPIApplicationCommandsResult,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import { argv, env, Logger } from '../utils';
import { Command } from '../commands';
import path from 'path';
import fs from 'fs';
import { ClientService } from './client-service';

export class CommandService {
  constructor(private rest: REST, private clientService: ClientService) {
    this.loadCommands();
  }

  private loadCommands(): void {
    const directories = ['../commands/channels', '../commands/moderation'];
    const commands: Command[] = [];

    for (const dir of directories) {
      const curr = path.join(__dirname, dir);
      try {
        const files = fs.readdirSync(curr);
        for (const file of files) {
          if (file.endsWith('.ts') || file.endsWith('.js')) {
            const commandImport = require(path.join(curr, file));
            const { default: commandClass } = commandImport;
            const newCommand = new commandClass();

            commands.push(newCommand);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${dir}`, error);
      }
    }

    this.clientService.commands = commands;
  }

  public async registerCommands(): Promise<void> {
    const metadata: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    for (const cmd of this.clientService.commands) {
      const meta: RESTPostAPIChatInputApplicationCommandsJSONBody = {
        type: cmd.type as ApplicationCommandType.ChatInput,
        name: cmd.name,
        description: cmd.description,
        dm_permission: cmd.dmPermission,
        default_member_permissions: cmd.defaultMemberPermissions,
        options: cmd.options,
      };
      metadata.push(meta);
    }

    try {
      for (let cmd of metadata) {
        await this.rest.post(Routes.applicationCommands(env.CLIENT_ID), { body: cmd });
      }
      Logger.info('Application commands have been registered!');
    } catch (error) {
      Logger.error('Error registering application commands', error);
    }
  }

  public async deleteAllCommands(): Promise<void> {
    let remoteCmds = (await this.rest.get(
      Routes.applicationCommands(env.CLIENT_ID)
    )) as RESTGetAPIApplicationCommandsResult;

    try {
      for (const cmd of remoteCmds) {
        await this.rest.delete(Routes.applicationCommand(env.CLIENT_ID, cmd.id));
      }
      Logger.info('Application commands have been deleted!');
    } catch (error) {
      Logger.error('Error deleting all slash commands', error);
    }
  }

  public async deleteSlashCommand(): Promise<void> {
    if (!argv[3]) {
      Logger.error('Please enter a command name: npm run commands:delete <name>');
      return;
    }

    let remoteCmds = (await this.rest.get(
      Routes.applicationCommands(env.CLIENT_ID)
    )) as RESTGetAPIApplicationCommandsResult;

    const commandName = argv[3];
    const remoteCmd = remoteCmds.find(remoteCmd => remoteCmd.name === commandName);

    if (!remoteCmd) {
      Logger.error(`Error finding ${commandName} command`);
      return;
    }

    try {
      await this.rest.delete(Routes.applicationCommand(env.CLIENT_ID, remoteCmd.id));
      Logger.info(`Deleted ${remoteCmd.name} command`);
    } catch (error) {
      Logger.error(`Error deleting ${commandName} command`, error);
    }
  }

  // public rename() {

  // }

  // public view() {

  // }

  // public clear() {

  // }
}
