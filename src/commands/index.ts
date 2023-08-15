// import { RegisterCommand } from './channels';
import { Command } from './command';
import { ModListCommand, ModReportCommand, PingCommand } from './moderation';

export { Command } from './command';
export { CommandMetadata } from './metadata';

export const commands: Command[] = [
  new PingCommand(),
  new ModListCommand(),
  new ModReportCommand(),
];
