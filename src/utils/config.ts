import { config } from 'dotenv';

config();

const { NODE_ENV, CLIENT_TOKEN, CLIENT_ID, MONGO_URL } = process.env;

if (!NODE_ENV) {
  throw new Error('Node environment is not defined in environment variables');
}

if (!CLIENT_TOKEN) {
  throw new Error('Client token is not defined in environment variables');
}

if (!CLIENT_ID) {
  throw new Error('Client id is not defined in environment variables');
}

if (!MONGO_URL) {
  throw new Error('Mongodb URL is not defined in environment variables');
}

export const env: Record<string, string> = {
  NODE_ENV,
  CLIENT_TOKEN,
  CLIENT_ID,
  MONGO_URL,
};

export const argv = process.argv;
