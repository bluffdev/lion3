import { Bot } from './bot';
import { CommandHandler } from './events';

(function start(): void {
  new Bot(new CommandHandler());
})();
