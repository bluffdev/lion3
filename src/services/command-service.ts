import {
  ApplicationCommandType,
  REST,
  RESTGetAPIApplicationCommandsResult,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import { argv, env, Logger } from '../utils';
import { ClientService } from './client-service';

export class CommandService {
  constructor(private rest: REST, private clientService: ClientService) {}

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

  public async deleteCommands(): Promise<void> {
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

  public async deleteCommand(): Promise<void> {
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
