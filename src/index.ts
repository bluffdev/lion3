import { Bot } from './bot';
import { CommandHandler } from './events';
import { classService, clientService, commandService, guildService } from './services';

(function start(): void {
  const bot = new Bot(
    clientService,
    commandService,
    guildService,
    classService,
    new CommandHandler()
  );
  bot.start();
})();
