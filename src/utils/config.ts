import { config } from 'dotenv';

config();

const { CLIENT_TOKEN } = process.env;

export const env: Record<string, string> = {
  CLIENT_TOKEN,
};

export const argv = process.argv;
