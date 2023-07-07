import { REST, RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js';
import { env, Logger } from '../utils';

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

  // public delete() {

  // }

  // public rename() {

  // }

  // public view() {

  // }

  // public clear() {

  // }
}
