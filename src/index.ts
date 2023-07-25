import { Bot } from './bot';
import { CommandHandler } from './events';
import { commands } from './commands';

(function start(): void {
  new Bot(new CommandHandler(commands));
})();
