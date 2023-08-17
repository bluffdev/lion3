import { Bot } from './bot';
import { CommandHandler } from './events';

(function start(): void {
  const bot = new Bot(new CommandHandler());
  bot.loadCommands();
  bot.start();
})();
