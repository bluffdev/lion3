import { Bot } from './bot';
import { CommandHandler } from './events';
import { classService, clientService, commandDeploymentService, guildService } from './services';

(function start(): void {
  const bot = new Bot(
    clientService,
    commandDeploymentService,
    guildService,
    classService,
    new CommandHandler()
  );
  bot.start();
})();
