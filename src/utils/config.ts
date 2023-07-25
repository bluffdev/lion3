import { config } from 'dotenv';

config();

const { CLIENT_TOKEN, CLIENT_ID, MONGO_URL } = process.env;

if (!CLIENT_TOKEN) {
  throw new Error('Client token didnt load');
}

export const env: Record<string, string> = {
  CLIENT_TOKEN,
  CLIENT_ID,
  MONGO_URL,
};

export const argv = process.argv;
