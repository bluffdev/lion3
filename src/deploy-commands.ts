import { CommandMetadata } from './commands';
import { commandDeploymentService } from './services';
import { argv } from './utils';

(async function deployCommands(): Promise<void> {
  switch (argv[2]) {
    case 'register': {
      let localCmds = [...Object.values(CommandMetadata)];
      try {
        await commandDeploymentService.registerAllCommands(localCmds);
      } catch (error) {
        throw new Error(error);
      }
      break;
    }
    case 'delete': {
      await commandDeploymentService.deleteAllCommands();
      break;
    }
  }
})();
