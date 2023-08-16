import { RegisterCommand, UnRegisterCommand } from './channels';
import { Command } from './command';
import { AnonReportCommand, ModListCommand, ModReportCommand, PingCommand } from './moderation';

export { Command } from './command';
export { CommandMetadata } from './metadata';

export const commands: Command[] = [
  new PingCommand(),
  new ModListCommand(),
  new ModReportCommand(),
  new AnonReportCommand(),
  new RegisterCommand(),
  new UnRegisterCommand(),
];
