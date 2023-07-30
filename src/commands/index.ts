// import { RegisterCommand } from './channels';
import { Command } from './command';
import { PingCommand } from './moderation';

export { Command } from './command';
export { CommandMetadata } from './metadata';

export const commands: Command[] = [new PingCommand()];
