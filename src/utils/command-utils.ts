import { Command } from '../commands';

export function findCommand(commands: Command[], commandParts: string[]): Command {
  let closestMatch: Command;
  for (const cmd of commands) {
    if (cmd.name === commandParts[0]) {
      closestMatch = cmd;
    }
  }
  return closestMatch;
}
