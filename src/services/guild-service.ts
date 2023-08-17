import { clientService } from './';
import { Guild, GuildChannel, GuildEmoji, Role, User } from 'discord.js';
import { Channels, Roles } from '../constants';

export class GuildService {
  private guild: Guild;
  private roleCache: Record<string, Role | undefined> = {
    [Roles.Unverifed]: undefined,
  };

  private channelCache: Record<string, GuildChannel | undefined> = {
    [Channels.Info.CodeOfConduct]: undefined,
    [Channels.Blacklist.Verify]: undefined,
  };

  public setGuild(): void {
    this.guild = clientService.guilds.cache.first();
  }

  public get(): Guild {
    return this.guild;
  }

  // Returns whether a member has a role
  // Can be overloaded with the string name of the role or a Role object
  public userHasRole(user: User, roleName: string | Role): boolean {
    const member = this.get().members.cache.get(user.id);
    if (!member) {
      return false;
    }

    if (typeof roleName === 'string') {
      const roleNameLower = roleName.toLowerCase();
      return member.roles.cache.filter(r => r.name.toLowerCase() === roleNameLower).size !== 0;
    } else {
      return member.roles.cache.filter(r => r === roleName).size !== 0;
    }
  }

  public getRole(roleName: string): Role {
    if (!this.roleCache[roleName]) {
      this.roleCache[roleName] = this.get()
        .roles.cache.filter(r => r.name === roleName)
        .first();
    }

    return this.roleCache[roleName];
  }

  public getChannel(chanName: string): GuildChannel {
    if (!this.channelCache[chanName]) {
      this.channelCache[chanName] = this.get()
        .channels.cache.filter(c => c.name === chanName)
        .first() as GuildChannel;
    }

    return this.channelCache[chanName];
  }

  public getEmoji(emojiName: string): GuildEmoji | undefined {
    const lowerEmojiName = emojiName.toLowerCase();
    return this.get()
      .emojis.cache.filter(e => e.name?.toLowerCase() === lowerEmojiName)
      .first();
  }
}
