export type Categories = {
  info: string;
  general: string;
  dailyRoutine: string;
  help: string;
  specialTopics: string;
  misc: string;
  audioChannels: string;
};

export type Info = {
  announcements: string;
  welcome: string;
  classInvite: string;
  codeOfConduct: string;
};

export type Public = {
  // UCF CS, ECE, AND IT
  serverSuggestions: string;

  // General and School Life
  clubOfficers: string;
  alumniLounge: string;
  gradCafe: string;

  pets: string;
  clubs: string;
  memes: string;
  general: string;
  networking: string;
  bulletinBoard: string;
  studentQuotes: string;
  professorQuotes: string;
  personalProject: string;
  clubAnnouncements: string;

  // Daily Routine
  food: string;
  media: string;
  sports: string;
  fitness: string;
  finance: string;
  vehicles: string;
  outdoors: string;
  videoGames: string;

  // Help
  advising: string;
  projectIdeas: string;
  foundationExam: string;
  bakingChat: string;
  programmingHelp: string;
  learningResources: string;
  mathScienceHelp: string;
  leetcodeDiscussion: string;

  // Special Topics
  security: string;
  industry: string;
  graphics: string;
  research: string;
  hardware: string;
  eceLounge: string;
  flameWars: string;
  osSoftware: string;
  mathLounge: string;
  extendedReality: string;
  gameDevelopment: string;
  internetNetworking: string;
  artificialIntelligence: string;
  softwareDevelopment: string;

  // Miscellaneous
  games: string;
  counting: string;
  bookClub: string;
  languages: string;
  lionProject: string;
  buySellTrade: string;
  lionProjectGithub: string;

  // Audio Channels
  hec: string;
  msb: string;
  cave: string;
  breezeway: string;
  hittLibrary: string;
};

export type Staff = {
  modChat: string;
  modCommands: string;
};

export type Admin = {
  adminChat: string;
  botLogs: string;
};

export type Bot = {
  botCommands: string;
};

export type Blacklist = {
  verify: string;
};

export type Channels = {
  info: Info;
  public: Public;
  staff: Staff;
  admin: Admin;
  bot: Bot;
  blacklist: Blacklist;
};

export type Roles = {
  Everyone: string;
  Professor: string;
  Unverifed: string;
  NitroBooster: string;
  TacoKing: string;
  TeachingAssistant: string;
  Moderator: string;
  Suspended: string;
  Alumni: string;
  GradStudent: string;
};
