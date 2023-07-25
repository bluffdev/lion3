// import { RegisterCommand } from './channels';
import { PingCommand } from './moderation';
import { Command } from './command';

export { Command } from './command';
export { CommandMetadata } from './metadata';

export const commands: Command[] = [PingCommand];
