import { DiscordAPIError } from 'discord.js';
import { pino } from 'pino';

let logger = pino(
  {
    formatters: {
      level: label => {
        return { level: label };
      },
    },
  },
  pino.transport({
    target: 'pino-pretty',
    options: {
      colorisze: true,
      ignore: 'pid,hostname',
      translateTime: 'yyyy-mm-dd HH:MM:ss.l',
    },
  })
);

export class Logger {
  public static info(message: string, obj?: any): void {
    obj ? logger.info(obj, message) : logger.info(message);
  }

  public static warn(message: string, obj?: any): void {
    obj ? logger.warn(obj, message) : logger.warn(message);
  }

  public static async error(message: string, obj?: any): Promise<void> {
    // Log just a message if no error object
    if (!obj) {
      logger.error(message);
      return;
    }

    // Otherwise log details about the error
    if (typeof obj === 'string') {
      logger
        .child({
          message: obj,
        })
        .error(message);
    } else if (obj instanceof DiscordAPIError) {
      logger
        .child({
          message: obj.message,
          code: obj.code,
          statusCode: obj.status,
          method: obj.method,
          url: obj.url,
          stack: obj.stack,
        })
        .error(message);
    } else {
      logger.error(obj, message);
    }
  }
}
