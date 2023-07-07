import { config } from 'dotenv';

config();

const { CLIENT_TOKEN, CLIENT_ID } = process.env;

if (!CLIENT_TOKEN) {
  throw new Error('Client token didnt load');
}

export const env: Record<string, string> = {
  CLIENT_TOKEN,
  CLIENT_ID,
};

export const argv = process.argv;
