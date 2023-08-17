import { Command } from './command';
import { Logger } from '../utils';
import fs from 'fs';
import path from 'path';

export { Command } from './command';
export { CommandMetadata } from './metadata';

export const commands: Command[] = [];

const directories = ['/channels', '/moderation'];

for (const dir of directories) {
  const curr = path.join(__dirname, dir);
  fs.readdir(curr, (_err, files) => {
    files.forEach(async file => {
      try {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const commandImport = await require(`${curr}/${file}`);
          const { default: commandClass } = commandImport;
          commands.push(new commandClass());
        }
      } catch (error) {
        Logger.error('Error with commands', error);
      }
    });
  });
}
