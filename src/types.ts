export interface AudioLesson {
  id: string;
  categoryId: string;
  courseId: string;
  order: number;
  title: string;
  description: string;
  fileId: string;
  fileName: string;
  duration: number; // in seconds
  audioUrl?: string;
  createdAt: string;
  addedBy?: string;
}

export interface Course {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  order?: number;
}

export interface Category {
  id: string;
  title: string;
  icon?: string;
  order?: number;
}

export interface CatalogData {
  categories: Category[];
  courses: Course[];
  lessons: AudioLesson[];
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
  url?: string;
}

export interface TelegramMessage {
  id: string;
  sender: 'bot' | 'user' | 'system';
  text?: string;
  audio?: {
    fileId: string;
    fileName: string;
    title: string;
    performer?: string;
    duration: number;
    audioUrl?: string;
  };
  replyMarkup?: {
    inline_keyboard: InlineKeyboardButton[][];
  };
  timestamp: number;
  isAudio?: boolean;
}

export interface AdminIngestionPayload {
  senderId: string;
  chatId: string;
  caption: string;
  fileId: string;
  fileName: string;
  duration: number;
  audioUrl?: string;
}

export interface ParsedCaption {
  categoryTitle: string;
  courseTitle: string;
  lessonTitle: string;
  description: string;
  isValid: boolean;
  missingFields: string[];
}

export interface BotConfig {
  token: string;
  trustedAdminIds: string[];
  botUsername: string;
  webhookUrl: string;
  isPollingActive: boolean;
}

export interface AnalyticsUser {
  id: string;
  username?: string;
  firstName?: string;
  platform: 'telegram' | 'web';
  firstSeen: string;
  lastSeen: string;
  lastSeenTimestamp: number;
  interactionsCount: number;
  lessonsPlayed: string[];
  searchQueries: string[];
  isOnline: boolean;
}

export interface ActivityEvent {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details: string;
  lessonId?: string;
}

export interface AnalyticsSummary {
  onlineCount: number;
  active24hCount: number;
  totalUsers: number;
  totalPlays: number;
  totalInteractions: number;
  popularLessons: {
    id: string;
    title: string;
    count: number;
    categoryTitle?: string;
    courseTitle?: string;
  }[];
  users: AnalyticsUser[];
  recentEvents: ActivityEvent[];
  hourlyActivity: { hour: string; count: number }[];
  dailyActivity: { date: string; visitors: number; plays: number }[];
}

export interface AuditLogItem {
  id: string;
  timestamp: number;
  senderId: string;
  status: 'success' | 'rejected_unauthorized' | 'parse_error' | 'duplicate_skipped';
  details: string;
  lessonTitle?: string;
}
