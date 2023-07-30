import {
  REST,
  RESTGetAPIApplicationCommandsResult,
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord.js';
import { argv, env, Logger } from '../utils';

export class CommandDeploymentService {
  constructor(private rest: REST) {}

  public async register(localCmds: RESTPostAPIApplicationCommandsJSONBody[]): Promise<void> {
    try {
      for (let cmd of localCmds) {
        await this.rest.post(Routes.applicationCommands(env.CLIENT_ID), { body: cmd });
      }
      Logger.info('Application commands have been registered!');
    } catch (error) {
      Logger.error('Error registering application commands', error);
    }
  }

  public async delete(): Promise<void> {
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
