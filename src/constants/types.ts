export type Info = {
  Announcements: string;
  Welcome: string;
  ClassInvite: string;
  CodeOfConduct: string;
};

export type Public = {
  // UCF CS, ECE, AND IT
  ServerSuggestions: string;

  // General and School Life
  ClubOfficers: string;
  AlumniLounge: string;
  GradCafe: string;

  Pets: string;
  Clubs: string;
  Memes: string;
  General: string;
  Networking: string;
  BulletinBoard: string;
  StudentQuotes: string;
  ProfessorQuotes: string;
  PersonalProject: string;
  ClubAnnouncements: string;

  // Daily Routine
  Food: string;
  Media: string;
  Sports: string;
  Fitness: string;
  Finance: string;
  Vehicles: string;
  Outdoors: string;
  VideoGames: string;

  // Help
  Advising: string;
  ProjectIdeas: string;
  FoundationExam: string;
  BakingChat: string;
  ProgrammingHelp: string;
  LearningResources: string;
  MathScienceHelp: string;
  LeetcodeDiscussion: string;

  // Special Topics
  Security: string;
  Industry: string;
  Graphics: string;
  Research: string;
  Hardware: string;
  EceLounge: string;
  FlameWars: string;
  OsSoftware: string;
  MathLounge: string;
  ExtendedReality: string;
  GameDevelopment: string;
  InternetNetworking: string;
  ArtificialIntelligence: string;
  SoftwareDevelopment: string;

  // Miscellaneous
  Games: string;
  Counting: string;
  BookClub: string;
  Languages: string;
  LionProject: string;
  BuySellTrade: string;
  LionProjectGithub: string;

  // Audio Channels
  Hec: string;
  Msb: string;
  Cave: string;
  Breezeway: string;
  HittLibrary: string;
};

export type Staff = {
  ModChat: string;
  ModCommands: string;
};

export type Admin = {
  AdminChat: string;
  BotLogs: string;
};

export type Bot = {
  BotCommands: string;
};

export type Blacklist = {
  Verify: string;
};

export type ChannelsType = {
  Info: Info;
  Public: Public;
  Staff: Staff;
  Admin: Admin;
  Bot: Bot;
  Blacklist: Blacklist;
};
