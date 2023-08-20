import { argv } from './utils';
import { commandService } from './services';

(function run(): void {
  switch (argv[2]) {
    case 'register': {
      commandService.registerCommands();
      break;
    }
    case 'delete': {
      commandService.deleteCommands();
      break;
    }
  }
})();
