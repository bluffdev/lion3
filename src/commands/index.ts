// import { RegisterCommand } from './channels';
import { Command } from './command';
import { PingCommand, ReportCommand, WarnCommand } from './moderation';

export { Command } from './command';
export { CommandMetadata } from './metadata';

export const commands: Command[] = [new PingCommand(), new ReportCommand(), new WarnCommand()];
