import { GuildChannel, PermissionFlagsBits, User } from 'discord.js';
import { ClassType, IClassRequest, Logger, RequestType } from '../utils';
import { GuildService } from './guild-service';

export interface IRegisterData {
  classChan: GuildChannel;
  user: User;
}

export class ClassService {
  constructor(private guildService: GuildService) {}

  private channels = new Map<ClassType, Map<string, GuildChannel>>();

  // When someone is allowed in a channel the bitfield value is the sum of their permissionOverwrites
  private _ALLOW_BITFIELD = PermissionFlagsBits.ViewChannel + PermissionFlagsBits.SendMessages;
  private _DENY_BITFIELD = 0;
  private _MAX_CLASS_LIST_LEN = 1600;

  public getClasses(classType: ClassType): Map<string, GuildChannel> {
    if (classType === ClassType.ALL) {
      const ret = new Map<string, GuildChannel>();
      for (const classType of Object.keys(ClassType).filter(k => k !== ClassType.ALL)) {
        for (const [key, value] of this.getClasses(this.resolveClassType(classType)).entries()) {
          ret.set(key, value);
        }
      }
      return ret;
    }
    return this.channels.get(classType) ?? new Map<string, GuildChannel>();
  }

  public userIsRegistered(chan: GuildChannel, user: User): boolean {
    const perms = chan.permissionOverwrites.cache.get(user.id);
    if (!perms) {
      return false;
    }

    return perms.allow.bitfield === this._ALLOW_BITFIELD;
  }

  public async register(request: IClassRequest): Promise<boolean> {
    const { author, className } = request;

    if (!className) {
      Logger.error('Request does not have a class name');
      return false;
    }

    try {
      const classChannel = this.findClassByName(className);
      if (!classChannel) {
        throw new Error('Unable to locate this class');
      }

      if (this.userIsRegistered(classChannel, author)) {
        Logger.info('User is already registerd for this class');
        return false;
      }

      await this.addClass({ classChan: classChannel, user: author });
      return true;
    } catch (error) {
      Logger.error('Error adding class for user', error);
      return false;
    }
  }

  private async addClass(classData: IRegisterData): Promise<string> {
    await classData.classChan.permissionOverwrites.create(classData.user.id, {
      ViewChannel: true,
      SendMessages: true,
    });
    return `You have successfully been added to ${classData.classChan}`;
  }

  public async unregister(request: IClassRequest): Promise<boolean> {
    const { author, className } = request;

    if (!className) {
      Logger.error('Request does not have a class name');
      return false;
    }

    try {
      const classChannel = this.findClassByName(className);
      if (!classChannel) {
        throw new Error('Unable to locate this class');
      }

      if (!this.userIsRegistered(classChannel, author)) {
        return false;
      }

      await this.removeClass({ classChan: classChannel, user: author });
      return true;
    } catch (error) {
      Logger.error('Error unregistering from class');
      return false;
    }
  }

  private async removeClass(classData: IRegisterData): Promise<string> {
    await classData.classChan.permissionOverwrites.create(classData.user.id, {
      ViewChannel: false,
      SendMessages: false,
    });
    return `You have successfully been removed from ${classData.classChan}`;
  }

  public buildRequest(author: User, args: string[] | undefined): IClassRequest | undefined {
    if (!args) {
      return undefined;
    }
    args = args.map(arg => arg.toUpperCase());
    let categoryType: ClassType | undefined = undefined;
    let requestType: RequestType;
    let className = '';

    if (args.length === 2) {
      const category = args[1];
      categoryType = this.resolveClassType(category);
    }

    if (!categoryType) {
      requestType = RequestType.Channel;
      className = args[0];
    } else {
      requestType = RequestType.Category;
    }

    // In the case of a user inputting `!register all`, we will need to take care of this corner case.
    if (args.length === 1 && args[0] === ClassType.ALL) {
      requestType = RequestType.Category;
      categoryType = ClassType.ALL;
      args[0] = '';
    }

    return {
      author,
      categoryType,
      requestType,
      className,
    };
  }

  public updateClasses(): void {
    this.channels.clear();
    this.addClasses();
  }

  public addClasses(): void {
    this.guildService.get()?.channels.cache.forEach(channel => {
      if (channel.isThread()) {
        return;
      }

      if (!channel.parentId) {
        return;
      }

      const category = this.guildService.get().channels.cache.get(channel.parentId);

      if (category?.name.toLowerCase().includes('classes')) {
        for (const classType of Object.keys(ClassType).filter(k => k !== ClassType.ALL)) {
          if (category.name.toUpperCase() === `${classType}-CLASSES`) {
            const classes = this.getClasses(this.resolveClassType(classType));
            classes.set(channel.name, channel);
            this.channels.set(this.resolveClassType(classType), classes);
          }
        }
      }
    });
  }

  public resolveClassType(classType: string): ClassType {
    return ClassType[classType as keyof typeof ClassType];
  }

  public buildClassListText(classType: string): string[] {
    const classGroupsToList =
      classType === ClassType.ALL
        ? Object.keys(ClassType).filter(k => k !== ClassType.ALL)
        : [classType];

    const responses = [];
    for (const classType of classGroupsToList) {
      const classNames = Array.from(
        this.getClasses(this.resolveClassType(classType)),
        ([, v]) => v.name
      ).sort();

      const startOfResponse = `\`\`\`\n${classType} Classes:`;
      let currentResponse = startOfResponse;
      for (const className of classNames) {
        if (currentResponse.length + className.length + 4 >= this._MAX_CLASS_LIST_LEN) {
          currentResponse += '\n```';
          responses.push(currentResponse);
          currentResponse = startOfResponse;
          console.log(currentResponse);
        }
        currentResponse += `\n${className}`;
      }

      if (currentResponse.length) {
        currentResponse += '\n```';
        responses.push(currentResponse);
      }
    }

    return responses;
  }

  public isClassChannel(className: string): boolean {
    return Boolean(this.findClassByName(className));
  }

  private async _registerAll(author: User, categoryType: ClassType): Promise<string> {
    if (!categoryType) {
      categoryType = ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [, channel] = classObj;

      if (this.userIsRegistered(channel, author)) {
        continue;
      }
      await channel.permissionOverwrites.create(author.id, {
        ViewChannel: true,
        SendMessages: true,
      });
    }
    return `You have successfully been added to the ${categoryType} category.`;
  }

  private async _unregisterAll(author: User, categoryType: ClassType | undefined): Promise<string> {
    if (!categoryType) {
      categoryType = ClassType.ALL;
    }

    const classes = this.getClasses(categoryType);
    for (const classObj of classes) {
      const [, channel] = classObj;

      const currentPerms = channel.permissionOverwrites.cache.get(author.id);
      if (currentPerms) {
        // Bitfield is 0 for deny, 1 for allow
        if (currentPerms.allow.equals(BigInt(this._DENY_BITFIELD))) {
          continue;
        }
      }
      await channel.permissionOverwrites.create(author.id, {
        ViewChannel: false,
        SendMessages: false,
      });
    }
    return `You have successfully been removed from the ${categoryType} category.`;
  }

  public findClassByName(className: string): GuildChannel | undefined {
    className = className.toLowerCase();
    const classes = this.getClasses(ClassType.ALL);
    for (const classObj of classes) {
      const [classChanName, classChanObj] = classObj;
      if (classChanName === className) {
        return classChanObj;
      }
    }
    return undefined;
  }
}
