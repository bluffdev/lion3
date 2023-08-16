import { User } from 'discord.js';

export enum ClassType {
  IT = 'IT',
  CS = 'CS',
  CSGRAD = 'CSGRAD',
  EE = 'EE',
  EEGRAD = 'EEGRAD',
  GENED = 'GENED',
  ALL = 'ALL',
}

export enum RequestType {
  Channel = 'Channel',
  Category = 'Category',
}

export interface IClassRequest {
  author: User;
  categoryType?: ClassType;
  requestType: RequestType;
  className?: string;
}
