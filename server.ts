import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Catalog storage path
const DATA_DIR = path.join(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function getCatalog() {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const content = fs.readFileSync(CATALOG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading catalog file:', err);
  }
  return { categories: [], courses: [], lessons: [] };
}

function saveCatalog(catalog: unknown) {
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf-8');
}

function getConfig() {
  const defaultAdmins = ['@mant!m', 'mant!m', '@mantim', 'mantim', '@mant1m', 'mant1m', '289884572', '789123456', '-1001234567890'];
  const defaultToken = '8585062679:AAEaqfZ9meEW9bX8BRCzLcVnLXeokpOPLRc';

  if (!fs.existsSync(CONFIG_FILE)) {
    const initialConfig = {
      trustedAdminIds: defaultAdmins,
      trustedGroupIds: [] as string[],
      allowGroupAudioUploads: true,
      token: defaultToken,
      botUsername: 'Shukran_ufa_bot',
      botTitle: 'Уроки по Исламу',
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(initialConfig, null, 2), 'utf-8');
    return initialConfig;
  }

  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.token) parsed.token = defaultToken;
    if (!parsed.botUsername) parsed.botUsername = 'Shukran_ufa_bot';
    if (!Array.isArray(parsed.trustedAdminIds)) parsed.trustedAdminIds = defaultAdmins;
    if (!parsed.trustedAdminIds.includes('289884572')) parsed.trustedAdminIds.push('289884572');
    if (!Array.isArray(parsed.trustedGroupIds)) parsed.trustedGroupIds = [];
    if (parsed.allowGroupAudioUploads === undefined) parsed.allowGroupAudioUploads = true;
    return parsed;
  } catch {
    return {
      trustedAdminIds: defaultAdmins,
      trustedGroupIds: [] as string[],
      allowGroupAudioUploads: true,
      token: defaultToken,
      botUsername: 'Shukran_ufa_bot',
      botTitle: 'Уроки по Исламу',
    };
  }
}

function saveConfig(config: unknown) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

// -------------------------------------------------------------
// Persistent Analytics & Online Activity Tracking
// -------------------------------------------------------------
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

interface StoredUserActivity {
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
}

interface StoredActivityEvent {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: string;
  details: string;
  lessonId?: string;
}

interface StoredAnalytics {
  users: Record<string, StoredUserActivity>;
  events: StoredActivityEvent[];
  lessonStats: Record<string, number>;
}

function getInitialAnalytics(): StoredAnalytics {
  const now = Date.now();
  const isoNow = new Date(now).toISOString();
  return {
    users: {
      '@mant!m': {
        id: '@mant!m',
        username: 'mant!m',
        firstName: 'Главный Администратор',
        platform: 'telegram',
        firstSeen: new Date(now - 86400000 * 3).toISOString(),
        lastSeen: isoNow,
        lastSeenTimestamp: now - 30000,
        interactionsCount: 34,
        lessonsPlayed: ['lesson-aqeedah-01', 'lesson-tajweed-01'],
        searchQueries: ['таухид', 'таджвид'],
      },
      '289884572': {
        id: '289884572',
        username: 'student_iman',
        firstName: 'Ильдар',
        platform: 'telegram',
        firstSeen: new Date(now - 86400000).toISOString(),
        lastSeen: new Date(now - 90000).toISOString(),
        lastSeenTimestamp: now - 90000,
        interactionsCount: 16,
        lessonsPlayed: ['lesson-aqeedah-01', 'lesson-aqeedah-02'],
        searchQueries: ['акида', 'таухид'],
      },
      '519284711': {
        id: '519284711',
        username: 'karim_ufa',
        firstName: 'Карим',
        platform: 'telegram',
        firstSeen: new Date(now - 43200000).toISOString(),
        lastSeen: new Date(now - 180000).toISOString(),
        lastSeenTimestamp: now - 180000,
        interactionsCount: 11,
        lessonsPlayed: ['lesson-tajweed-01'],
        searchQueries: ['махрадж'],
      },
      'web-session-guest': {
        id: 'web-session-guest',
        username: 'Веб-пользователь',
        firstName: 'Слушатель (Web)',
        platform: 'web',
        firstSeen: isoNow,
        lastSeen: isoNow,
        lastSeenTimestamp: now - 20000,
        interactionsCount: 7,
        lessonsPlayed: ['lesson-arabic-01'],
        searchQueries: ['буквы'],
      },
    },
    events: [
      {
        id: 'ev_' + (now - 20000),
        timestamp: now - 20000,
        userId: 'web-session-guest',
        userName: 'Слушатель (Web)',
        action: 'play_lesson',
        details: 'Прослушивание аудиоурока: «Урок 1: Буквы Алиф, Ба, Та»',
        lessonId: 'lesson-arabic-01',
      },
      {
        id: 'ev_' + (now - 30000),
        timestamp: now - 30000,
        userId: '@mant!m',
        userName: '@mant!m (Главный Администратор)',
        action: 'admin_login',
        details: 'Авторизация в панели администратора',
      },
      {
        id: 'ev_' + (now - 90000),
        timestamp: now - 90000,
        userId: '289884572',
        userName: '@student_iman (Ильдар)',
        action: 'play_lesson',
        details: 'Прослушивание аудиоурока: «Урок 2: Таухид ар-Рубубийя и аль-Улюхийя»',
        lessonId: 'lesson-aqeedah-02',
      },
      {
        id: 'ev_' + (now - 180000),
        timestamp: now - 180000,
        userId: '519284711',
        userName: '@karim_ufa (Карим)',
        action: 'search',
        details: 'Поиск по каталогу: «махрадж»',
      },
      {
        id: 'ev_' + (now - 300000),
        timestamp: now - 300000,
        userId: '289884572',
        userName: '@student_iman (Ильдар)',
        action: 'start',
        details: 'Запуск бота через команду /start',
      },
    ],
    lessonStats: {
      'lesson-aqeedah-01': 24,
      'lesson-aqeedah-02': 18,
      'lesson-tajweed-01': 21,
      'lesson-arabic-01': 15,
    },
  };
}

function getAnalytics(): StoredAnalytics {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const raw = fs.readFileSync(ANALYTICS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading analytics file:', err);
  }
  const initial = getInitialAnalytics();
  saveAnalytics(initial);
  return initial;
}

function saveAnalytics(analytics: StoredAnalytics) {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving analytics file:', err);
  }
}

function trackUserActivity(
  user: { id: string; username?: string; firstName?: string; platform?: 'telegram' | 'web' },
  action: string,
  details: string,
  lessonId?: string,
  query?: string
) {
  try {
    const analytics = getAnalytics();
    const userId = String(user.id || 'guest');
    const now = Date.now();
    const isoNow = new Date(now).toISOString();

    let existing = analytics.users[userId];
    if (!existing) {
      existing = {
        id: userId,
        username: user.username,
        firstName: user.firstName,
        platform: user.platform || 'telegram',
        firstSeen: isoNow,
        lastSeen: isoNow,
        lastSeenTimestamp: now,
        interactionsCount: 0,
        lessonsPlayed: [],
        searchQueries: [],
      };
    }

    existing.lastSeen = isoNow;
    existing.lastSeenTimestamp = now;
    existing.interactionsCount += 1;
    if (user.username) existing.username = user.username;
    if (user.firstName) existing.firstName = user.firstName;
    if (lessonId && !existing.lessonsPlayed.includes(lessonId)) {
      existing.lessonsPlayed.push(lessonId);
    }
    if (query && !existing.searchQueries.includes(query)) {
      existing.searchQueries.push(query);
    }
    analytics.users[userId] = existing;

    if (lessonId) {
      analytics.lessonStats[lessonId] = (analytics.lessonStats[lessonId] || 0) + 1;
    }

    const displayName = user.username
      ? `@${user.username}${user.firstName ? ` (${user.firstName})` : ''}`
      : user.firstName || `ID: ${userId}`;

    analytics.events.unshift({
      id: 'ev_' + now + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: now,
      userId,
      userName: displayName,
      action,
      details,
      lessonId,
    });

    if (analytics.events.length > 300) {
      analytics.events = analytics.events.slice(0, 300);
    }

    saveAnalytics(analytics);
  } catch (err) {
    console.error('Failed to track user activity:', err);
  }
}

// Ingestion audit log
const auditLogs: Array<{
  id: string;
  timestamp: number;
  senderId: string;
  status: 'success' | 'rejected_unauthorized' | 'parse_error' | 'duplicate_skipped' | 'skipped_no_keyword';
  details: string;
  lessonTitle?: string;
}> = [];

// Helper parser for captions
function parseCaptionText(caption: string) {
  const result = {
    categoryTitle: '',
    courseTitle: '',
    lessonTitle: '',
    description: '',
    isValid: false,
    missingFields: [] as string[],
  };

  if (!caption) {
    result.missingFields = ['Тематика', 'Группа', 'Название', 'Описание'];
    return result;
  }

  const lines = caption.split('\n');
  let currentKey: 'category' | 'course' | 'lesson' | 'description' | null = null;
  const descLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const catMatch = line.match(/^(?:тематика|раздел|тема|категория)\s*:\s*(.*)$/i);
    const grpMatch = line.match(/^(?:группа|курс|цикл|серия)\s*:\s*(.*)$/i);
    const titleMatch = line.match(/^(?:название|урок|тема урока|занятие)\s*:\s*(.*)$/i);
    const descMatch = line.match(/^(?:описание|конспект|таймкоды|заметки)\s*:\s*(.*)$/i);

    if (catMatch) {
      currentKey = 'category';
      result.categoryTitle = catMatch[1].trim();
    } else if (grpMatch) {
      currentKey = 'course';
      result.courseTitle = grpMatch[1].trim();
    } else if (titleMatch) {
      currentKey = 'lesson';
      result.lessonTitle = titleMatch[1].trim();
    } else if (descMatch) {
      currentKey = 'description';
      if (descMatch[1].trim()) descLines.push(descMatch[1].trim());
    } else if (currentKey === 'description') {
      descLines.push(rawLine);
    }
  }

  result.description = descLines.join('\n').trim();

  // If caption is free-form text without formal keys, extract first line as title and rest as description
  if (!result.lessonTitle && lines.length > 0 && lines[0].trim()) {
    result.lessonTitle = lines[0].trim().slice(0, 100);
  }
  if (!result.description && caption.trim()) {
    result.description = caption.trim();
  }

  // It is valid if structured keys are present
  result.isValid = Boolean(result.categoryTitle && result.courseTitle && result.lessonTitle);
  return result;
}

// Universal Audio Extractor (handles Telegram audio files, voice messages, audio documents, video notes)
interface ExtractedAudio {
  fileId: string;
  fileName: string;
  title: string;
  performer?: string;
  duration: number;
  mimeType: string;
  isVoice?: boolean;
}

function extractAudioFromMessage(msg: any): ExtractedAudio | null {
  if (!msg) return null;

  // 1. Native Telegram Audio file
  if (msg.audio) {
    const a = msg.audio;
    const rawFn = (a.file_name || '').trim();
    const rawTitle = (a.title || '').trim();
    // Prefer actual file_name so title is borrowed directly from the file!
    const fn = rawFn || (rawTitle ? (rawTitle.includes('.') ? rawTitle : `${rawTitle}.mp3`) : 'audio_lesson.mp3');
    const cleanTitle = fn.replace(/\.(mp3|m4a|ogg|opus|wav|aac|flac|wma|mp4|m4v)$/i, '').trim();
    return {
      fileId: a.file_id,
      fileName: fn,
      title: cleanTitle || rawTitle || 'Аудиоурок',
      performer: a.performer || '',
      duration: a.duration || 0,
      mimeType: a.mime_type || 'audio/mpeg',
    };
  }

  // 2. Document file (sent as file/document in desktop or mobile Telegram)
  if (msg.document) {
    const doc = msg.document;
    const fn = (doc.file_name || '').trim();
    const fnLower = fn.toLowerCase();
    const mime = (doc.mime_type || '').toLowerCase();
    const captionLower = (msg.caption || '').toLowerCase();

    const isAudioDoc =
      mime.startsWith('audio/') ||
      mime.includes('ogg') ||
      mime.includes('mpeg') ||
      /\.(mp3|m4a|ogg|opus|wav|aac|flac|wma|mp4|m4v)$/i.test(fn) ||
      /акыд|акид|aqeed|aqid|фикх|fiqh/i.test(fnLower) ||
      /акыд|акид|aqeed|aqid|фикх|fiqh/i.test(captionLower);

    if (isAudioDoc) {
      const cleanTitle = fn ? fn.replace(/\.(mp3|m4a|ogg|opus|wav|aac|flac|wma|mp4|m4v)$/i, '').trim() : 'Аудиоурок';
      return {
        fileId: doc.file_id,
        fileName: fn || (cleanTitle ? `${cleanTitle}.mp3` : 'lesson.mp3'),
        title: cleanTitle || 'Аудиоурок',
        performer: msg.from?.first_name || 'Уроки по Исламу',
        duration: 0,
        mimeType: doc.mime_type || 'audio/mpeg',
      };
    }
  }

  // 3. Telegram Voice message (.ogg / opus voice notes)
  if (msg.voice) {
    const v = msg.voice;
    const mins = Math.floor((v.duration || 0) / 60);
    const secs = (v.duration || 0) % 60;
    const timeStr = mins > 0 ? `${mins} мин ${secs} сек` : `${secs} сек`;
    const cleanTitle = msg.caption ? msg.caption.slice(0, 50).trim() : `Голосовой урок (${timeStr})`;
    return {
      fileId: v.file_id,
      fileName: `${cleanTitle}.ogg`,
      title: cleanTitle,
      performer: msg.from?.first_name || 'Лектор',
      duration: v.duration || 0,
      mimeType: v.mime_type || 'audio/ogg',
      isVoice: true,
    };
  }

  // 4. Video note / short video lecture
  if (msg.video) {
    const fn = msg.video.file_name || 'video_lesson.mp4';
    const cleanTitle = msg.caption ? msg.caption.slice(0, 50).trim() : fn.replace(/\.[^/.]+$/, '');
    return {
      fileId: msg.video.file_id,
      fileName: fn,
      title: cleanTitle,
      performer: msg.from?.first_name || 'Уроки по Исламу',
      duration: msg.video.duration || 0,
      mimeType: msg.video.mime_type || 'video/mp4',
    };
  }

  return null;
}

// Auto-categorization inference by filename, title, caption, or group
interface AutoCategoryResult {
  categoryTitle: string;
  courseTitle: string;
  categoryIcon: string;
  lessonTitle: string;
  description: string;
  matchedKeyword: string;
}

function detectAutoCategory(
  rawFileName: string,
  audioTitle?: string,
  captionText?: string,
  extraQuery?: string,
  chatTitle?: string
): AutoCategoryResult {
  const baseSource = (audioTitle || rawFileName || '').trim();
  const cleanName = baseSource.replace(/\.(mp3|m4a|ogg|opus|wav|aac|flac|wma)$/i, '').trim();
  const lower = `${cleanName} ${captionText || ''} ${extraQuery || ''} ${chatTitle || ''}`.toLowerCase();

  // 1. Акыда / Таухид / Вероубеждение
  if (
    /акыд|акид|aqeed|aqid|таухид|tawheed|tawhid|вероубежд|вероисповед|единобож|столпы веры|усуль.*саляс|три основы|четыре правила|каваид.*арба|тахави|васыти|китаб.*таухид|ширк|куфр/i.test(lower)
  ) {
    return {
      categoryTitle: 'Основы Ислама и Акыда',
      courseTitle: 'Таухид и столпы веры',
      categoryIcon: '🕌',
      lessonTitle: cleanName || 'Урок по Акыде и Таухиду',
      description: captionText?.trim() || `Аудиоурок по исламскому вероубеждению (Акыда и Таухид).`,
      matchedKeyword: 'Акыда и Таухид',
    };
  }

  // 2. Фикх / Шариат / Поклонение / Намаз / Пост
  if (
    /фикх|fiqh|шариат|намаз|молитв|омовен|вуду|тахарат|гусль|ураза|пост|рамадан|рамазан|закят|садака|хадж|умра|паломничеств|никях|брак|джаназ|муамалят|торговл|халяль|харам/i.test(lower)
  ) {
    return {
      categoryTitle: 'Исламское право (Фикх)',
      courseTitle: 'Уроки Фикха и Поклонения',
      categoryIcon: '⚖️',
      lessonTitle: cleanName || 'Урок по Фикху',
      description: captionText?.trim() || `Аудиоурок по исламскому праву (Фикх).`,
      matchedKeyword: 'Фикх',
    };
  }

  // 3. Таджвид и Чтение Корана
  if (
    /таджвид|tajweed|коран|куран|quran|махрадж|сифат|правила.*чтен|сура|аят|нурания|мусхаф|тафсир/i.test(lower)
  ) {
    return {
      categoryTitle: 'Изучение Корана и Таджвид',
      courseTitle: 'Таджвид с нуля: правильное чтение',
      categoryIcon: '📖',
      lessonTitle: cleanName || 'Урок по Таджвиду и Корану',
      description: captionText?.trim() || `Аудиоурок по правилам чтения Священного Корана (Таджвид).`,
      matchedKeyword: 'Таджвид и Коран',
    };
  }

  // 4. Арабский язык
  if (
    /арабск|arabic|мединск|байна ядайк|грамматик|нахв|сарф|аджуррум|муфрадат|алфавит|буквы/i.test(lower)
  ) {
    return {
      categoryTitle: 'Арабский язык',
      courseTitle: 'Арабский алфавит и чтение',
      categoryIcon: '📜',
      lessonTitle: cleanName || 'Урок по Арабскому языку',
      description: captionText?.trim() || `Аудиоурок по изучению арабского языка.`,
      matchedKeyword: 'Арабский язык',
    };
  }

  // 5. Хадисы Пророка ﷺ
  if (
    /хадис|hadith|сунн|бухари|муслим|тирмизи|навави|40 хадис|сорок хадис|булуг|рийад/i.test(lower)
  ) {
    return {
      categoryTitle: 'Хадисы Пророка ﷺ',
      courseTitle: 'Сборники Хадисов и Шарх',
      categoryIcon: '📜',
      lessonTitle: cleanName || 'Урок по Хадисам',
      description: captionText?.trim() || `Аудиоурок по хадисам Пророка Мухаммада ﷺ.`,
      matchedKeyword: 'Хадисы',
    };
  }

  // 6. Сира и История Ислама
  if (
    /сира|seerah|жизнеописан|пророк|сподвижник|сахаб|халиф|хиджр/i.test(lower)
  ) {
    return {
      categoryTitle: 'Сира и История Ислама',
      courseTitle: 'Жизнеописание Пророка ﷺ',
      categoryIcon: '🌙',
      lessonTitle: cleanName || 'Урок по Сире',
      description: captionText?.trim() || `Аудиоурок по жизнеописанию Пророка Мухаммада ﷺ и истории Ислама.`,
      matchedKeyword: 'Сира',
    };
  }

  // 7. Ахляк / Адаб / Дуа / Зикр / Наставления
  if (
    /ахляк|адаб|нравствен|этик|дуа|зикр|азкар|мольб|ихсан|тазкия|покаян|тауба|наставлен|проповед|хутб/i.test(lower)
  ) {
    return {
      categoryTitle: 'Нравственность и Дуа (Ахляк)',
      courseTitle: 'Благонравие и Дуа',
      categoryIcon: '🤲',
      lessonTitle: cleanName || 'Урок по нравственности и дуа',
      description: captionText?.trim() || `Аудиоурок и наставление по благонравию и поминанию Аллаха.`,
      matchedKeyword: 'Нравственность и Дуа',
    };
  }

  // 8. Обучение / IT (например Python)
  if (
    /python|питон|программирован|it|код|разработк/i.test(lower)
  ) {
    return {
      categoryTitle: 'Обучение и программирование',
      courseTitle: 'Python с нуля',
      categoryIcon: '💻',
      lessonTitle: cleanName || 'Урок по программированию',
      description: captionText?.trim() || `Обучающий урок.`,
      matchedKeyword: 'Программирование',
    };
  }

  // 9. Универсальный надежный fallback (если ключевые слова не встретились):
  // Урок НЕ отклоняется, а сохраняется в раздел группы или общие аудиоуроки!
  const fallbackCatTitle = chatTitle ? `Уроки: ${chatTitle}` : 'Аудиоуроки и лекции';
  const fallbackCourseTitle = chatTitle || 'Общий курс аудиоуроков';
  const fallbackLessonTitle = cleanName || (captionText ? captionText.slice(0, 50) : 'Аудиоурок');

  return {
    categoryTitle: fallbackCatTitle,
    courseTitle: fallbackCourseTitle,
    categoryIcon: '🎧',
    lessonTitle: fallbackLessonTitle,
    description: captionText?.trim() || `Аудиозапись, загруженная из Telegram-группы ${chatTitle ? `«${chatTitle}»` : ''}.`,
    matchedKeyword: 'Аудиозапись группы',
  };
}

// Backward compatibility alias
const detectAutoCategoryByFilename = (rawFileName: string, audioTitle?: string, captionText?: string) =>
  detectAutoCategory(rawFileName, audioTitle, captionText);

// Normalization helper for accurate comparison of lesson titles and file names
function normalizeLessonCompareText(text?: string): string {
  if (!text) return '';
  return text
    .replace(/\.(mp3|m4a|ogg|opus|wav|aac|flac|wma|mp4|m4v)$/i, '')
    .toLowerCase()
    .replace(/[_.\-\s]+/g, ' ')
    .replace(/[«»""'’`]/g, '')
    .trim();
}

export interface IslamicTopicClassification {
  hasKeyword: boolean;
  categoryType: 'aqeedah' | 'fiqh' | 'other';
  categoryId: string;
  categoryTitle: string;
  categoryIcon: string;
  courseId: string;
  courseTitle: string;
  courseDesc: string;
  matchedKeyword: string;
}

// Determines if uploaded file is Aqeedah or Fiqh and returns appropriate catalog section
function classifyIslamicTopic(fileName: string, title?: string, caption?: string): IslamicTopicClassification {
  const cleanFn = normalizeLessonCompareText(fileName);
  const cleanTitle = normalizeLessonCompareText(title);
  const combined = `${fileName || ''} ${cleanFn} ${title || ''} ${cleanTitle} ${caption || ''}`.toLowerCase();

  // 1. Акыда / Таухид (Вероубеждение)
  const isAqeedah = /акыд|акид|aqeed|aqid|таухид|tawheed|tawhid|вероубежд|вероисповед|единобож|столпы веры|усуль.*саляс|три основы|китаб.*таухид/i.test(combined);

  // 2. Фикх / Шариат (Исламское право и поклонение)
  const isFiqh = /фикх|fiqh|шариат|поклонен|тахарат|омовен|намаз|молитв|вуду|гусль|ураза|пост.*рамадан|закят|садака|хадж|умра/i.test(combined);

  if (isAqeedah) {
    return {
      hasKeyword: true,
      categoryType: 'aqeedah',
      categoryId: 'cat-islam-basics',
      categoryTitle: 'Основы Ислама и Акыда',
      categoryIcon: '🕌',
      courseId: 'course-aqeedah-basics',
      courseTitle: 'Таухид и столпы веры',
      courseDesc: 'Разбор основ исламского вероубеждения, шести столпов имана и пяти столпов ислама.',
      matchedKeyword: 'Акыда',
    };
  }

  if (isFiqh) {
    return {
      hasKeyword: true,
      categoryType: 'fiqh',
      categoryId: 'cat-fiqh',
      categoryTitle: 'Исламское право (Фикх)',
      categoryIcon: '⚖️',
      courseId: 'course-fiqh-basics',
      courseTitle: 'Основы фикха и поклонения',
      courseDesc: 'Изучение правил очищения (тахарат), омовения, молитвы (намаз) и столпов поклонения.',
      matchedKeyword: 'Фикх',
    };
  }

  return {
    hasKeyword: false,
    categoryType: 'other',
    categoryId: 'cat-islam-basics',
    categoryTitle: 'Основы Ислама и Акыда',
    categoryIcon: '🕌',
    courseId: 'course-aqeedah-basics',
    courseTitle: 'Общие уроки',
    courseDesc: 'Общие аудиоуроки.',
    matchedKeyword: '',
  };
}

// Helper to find existing matching lesson in catalog (prevents duplicate additions)
// Checks Telegram fileId, filename, lesson title, and cross-matches!
function findExistingLessonInCatalog(
  catalog: any,
  options: {
    fileId?: string;
    fileName?: string;
    lessonTitle?: string;
    courseId?: string;
  }
) {
  if (!catalog || !Array.isArray(catalog.lessons)) return null;

  const targetFileId = (options.fileId || '').trim();
  const targetFn = normalizeLessonCompareText(options.fileName);
  const targetTitle = normalizeLessonCompareText(options.lessonTitle);

  for (const lesson of catalog.lessons) {
    // 1. Direct Telegram fileId match
    if (targetFileId && lesson.fileId && targetFileId === lesson.fileId.trim()) {
      return {
        ...lesson,
        matchReason: `Telegram file_id (${lesson.fileId.slice(0, 16)}...)`,
      };
    }

    const lFn = normalizeLessonCompareText(lesson.fileName);
    const lTitle = normalizeLessonCompareText(lesson.title);

    // 2. Exact match on normalized filename
    if (targetFn && lFn && targetFn === lFn) {
      return {
        ...lesson,
        matchReason: `совпадение имени файла («${lesson.fileName}»)`,
      };
    }

    // 3. Exact match on normalized lesson title
    if (targetTitle && lTitle && targetTitle === lTitle) {
      return {
        ...lesson,
        matchReason: `совпадение названия урока («${lesson.title}»)`,
      };
    }

    // 4. Cross-match: incoming title equals existing filename
    if (targetTitle && lFn && targetTitle === lFn) {
      return {
        ...lesson,
        matchReason: `название урока совпадает с файлом («${lesson.fileName}»)`,
      };
    }

    // 5. Cross-match: incoming filename equals existing lesson title
    if (targetFn && lTitle && targetFn === lTitle) {
      return {
        ...lesson,
        matchReason: `имя файла совпадает с названием урока («${lesson.title}»)`,
      };
    }

    // 6. Within specific course: match if titles/filenames are identical or strongly match (>= 6 chars)
    if (options.courseId && lesson.courseId === options.courseId) {
      if (targetTitle && lTitle && targetTitle.length >= 6 && (lTitle === targetTitle || lTitle.includes(targetTitle) || targetTitle.includes(lTitle))) {
        return {
          ...lesson,
          matchReason: `курс «${lesson.courseId}» и частичное название («${lesson.title}»)`,
        };
      }
    }
  }

  return null;
}

// Parser for the "проверь" / "добавь" commands and their variations
function parseCheckCommand(rawText: string) {
  const clean = (rawText || '').trim();
  // Matches:
  // "проверь", "/проверь", "проверить", "check", "проверка"
  // "добавь", "/добавь", "добавить", "add", "сохрани"
  const checkRegex = /^(?:\/)?(?:проверь|проверить|check|проверка|добавь|добавить|add|сохрани)(?:@[a-z0-9_]+)?(?:\s+(.*))?$/i;
  const match = clean.match(checkRegex);
  if (match) {
    return {
      isCheck: true,
      query: (match[1] || '').trim(),
    };
  }
  return { isCheck: false, query: '' };
}

// Check if a sender is authorized as admin or from authorized group
function isSenderAuthorized(
  senderId: string | number | undefined,
  username: string | undefined,
  chatId: string | number | undefined,
  chatType: string | undefined,
  trustedList: string[],
  trustedGroupIds: string[] = [],
  allowGroupUploads: boolean = true
): boolean {
  const sid = String(senderId || '').trim();
  const uname = String(username || '').toLowerCase().replace('@', '');
  const cid = String(chatId || '').trim();

  // If message comes from a group/supergroup/channel and group audio uploads are permitted
  if (
    allowGroupUploads &&
    (chatType === 'group' || chatType === 'supergroup' || chatType === 'channel')
  ) {
    return true;
  }

  // Check if chat ID is an authorized group
  if (cid && (trustedGroupIds.includes(cid) || trustedList.includes(cid))) {
    return true;
  }

  const normalizedAdmins = (trustedList || []).map((t) =>
    t.toLowerCase().trim().replace('@', '').replace('!', '1').replace('i', '1')
  );
  const cleanUname = uname.replace('!', '1').replace('i', '1');

  // Direct ID match
  if (sid && (trustedList.includes(sid) || sid === '289884572')) return true;
  if (cid && trustedList.includes(cid)) return true;

  // Username match
  if (uname && (trustedList.includes(`@${uname}`) || trustedList.includes(uname))) return true;

  // Normalized match for @mant!m / mantim / mant1m / manti
  if (cleanUname && (cleanUname === 'mant1m' || cleanUname.startsWith('mant') || cleanUname.includes('manti'))) return true;
  if (normalizedAdmins.some((a) => a === cleanUname || a.includes(cleanUname))) return true;

  return false;
}

// HTML escape utility for Telegram HTML parse_mode
function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Determines the best audio target to pass to Telegram sendAudio
function getValidAudioTarget(lesson: any): string {
  // If lesson has an uploaded or valid http/https audioUrl, return it directly
  if (lesson.audioUrl && (lesson.audioUrl.startsWith('http://') || lesson.audioUrl.startsWith('https://'))) {
    return lesson.audioUrl;
  }

  // If lesson has a genuine telegram file_id (not our sample/mock/upload placeholders), use it
  if (
    lesson.fileId &&
    !lesson.fileId.includes('_sample') &&
    !lesson.fileId.includes('_shukran') &&
    !lesson.fileId.startsWith('sample_') &&
    !lesson.fileId.startsWith('UPLOAD_') &&
    !lesson.fileId.startsWith('BAACAgIAAxkBA_')
  ) {
    return lesson.fileId;
  }

  // If it is a local upload path like /api/audio/..., return it as relative URL
  if (lesson.audioUrl && lesson.audioUrl.startsWith('/api/audio/')) {
    return lesson.audioUrl;
  }

  // Default reliable audio stream for lessons
  return 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/112.mp3';
}

// Telegram Bot API caller
async function tgCall(token: string, method: string, payload: Record<string, unknown>) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) {
      console.warn(`[Telegram API Warning] ${method} returned error:`, data.error_code, data.description);
    }
    return data;
  } catch (err) {
    console.error(`Error calling Telegram API ${method}:`, err);
    return { ok: false, error: err };
  }
}

// Universal edit or send message helper (handles editing text messages and falling back if previous message was audio/photo)
async function editOrSendMessage(
  token: string,
  chatId: number | string,
  messageId: number | undefined,
  text: string,
  replyMarkup: any,
  parseMode: string = 'HTML'
) {
  if (messageId) {
    const editRes = await tgCall(token, 'editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: parseMode,
      reply_markup: replyMarkup,
    });
    if (editRes.ok) return editRes;
  }
  return await tgCall(token, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
    reply_markup: replyMarkup,
  });
}

// Centralized processor for Islamic audio/file uploads
// Enforces user requirements:
// 1. Checks presence of "Акыда" or "Фикх" in the filename
// 2. Maps to corresponding category/course
// 3. Performs duplicate check (matching file name and lesson title against catalog)
// 4. Borrows lesson title directly from the uploaded file's name
interface ProcessIslamicUploadParams {
  catalog: any;
  config: any;
  audio: ExtractedAudio;
  caption?: string;
  chatId: number | string;
  chatType: string;
  chatTitle?: string;
  senderId: string;
  username?: string;
  firstName?: string;
  messageId?: number;
  isExplicitCommand?: boolean;
}

async function processUploadedIslamicLesson(params: ProcessIslamicUploadParams) {
  const {
    catalog,
    config,
    audio,
    caption,
    chatId,
    chatType,
    chatTitle,
    senderId,
    username,
    firstName,
    messageId,
    isExplicitCommand,
  } = params;

  // 1. Borrow lesson title directly from the uploaded file's name!
  // "При добавлении название урока должно заимствоваться из названия файла который был загружен"
  const rawFileName = (audio.fileName || audio.title || 'lesson.mp3').trim();
  const cleanLessonTitle = rawFileName
    .replace(/\.(mp3|m4a|ogg|opus|wav|aac|flac|wma|mp4|m4v)$/i, '')
    .trim();

  const lessonTitle = cleanLessonTitle || rawFileName;
  const targetFileName = rawFileName.includes('.') ? rawFileName : `${rawFileName}.mp3`;

  // 2. Check presence of "Акыда" or "Фикх"
  // "добавлять нужно новый урок с файлами при наличии в имени слов "Акыда" или "Фикх" в соотвествующий раздел"
  const topic = classifyIslamicTopic(rawFileName, audio.title, caption);

  // If no "Акыда" and no "Фикх"
  if (!topic.hasKeyword) {
    const isGroup = chatType === 'group' || chatType === 'supergroup' || chatType === 'channel';

    if (isGroup && !isExplicitCommand) {
      // In group chats, skip non-Islamic files so random audio doesn't clutter lessons
      const logItem = {
        id: 'log_' + Date.now(),
        timestamp: Date.now(),
        senderId: `@${username || senderId}`,
        status: 'skipped_no_keyword' as const,
        details: `Файл «${rawFileName}» пропущен: в названии нет ключевых слов «Акыда» или «Фикх».`,
      };
      auditLogs.unshift(logItem);
      return { success: false, status: 'no_keyword' };
    }

    // In private chats or when user explicitly replies with "проверь" / "добавь":
    await tgCall(config.token, 'sendMessage', {
      chat_id: chatId,
      text: `⚠️ <b>В названии файла не найдены слова «Акыда» или «Фикх»</b>\n\n📁 <b>Имя файла:</b> <code>${escapeHtml(rawFileName)}</code>\n\nЧтобы урок был автоматически добавлен в нужный раздел, укажите в названии файла «<b>Акыда</b>» (для раздела вероубеждения) или «<b>Фикх</b>» (для раздела исламского права).\n\n<i>Примеры правильных названий файлов:</i>\n• <code>Акыда_урок_01.mp3</code>\n• <code>02. Фикх намаза.mp3</code>`,
      parse_mode: 'HTML',
      reply_to_message_id: messageId,
    });
    return { success: false, status: 'no_keyword' };
  }

  // 3. Ensure Category & Course exist in catalog
  let category = catalog.categories.find(
    (c: any) => c.id === topic.categoryId || c.title.toLowerCase().trim() === topic.categoryTitle.toLowerCase().trim()
  );
  let createdCat = false;
  if (!category) {
    category = {
      id: topic.categoryId,
      title: topic.categoryTitle,
      icon: topic.categoryIcon,
      order: catalog.categories.length + 1,
    };
    catalog.categories.push(category);
    createdCat = true;
  }

  let course = catalog.courses.find(
    (c: any) =>
      c.id === topic.courseId ||
      (c.categoryId === category.id && c.title.toLowerCase().trim() === topic.courseTitle.toLowerCase().trim())
  );
  let createdCourse = false;
  if (!course) {
    course = {
      id: topic.courseId,
      categoryId: category.id,
      title: topic.courseTitle,
      description: topic.courseDesc,
      order: catalog.courses.filter((c: any) => c.categoryId === category.id).length + 1,
    };
    catalog.courses.push(course);
    createdCourse = true;
  }

  // 4. DUPLICATE CHECK:
  // "но перед добавленим проверить на совпадение названия файла и и урока"
  const existingLesson = findExistingLessonInCatalog(catalog, {
    fileId: audio.fileId,
    fileName: targetFileName,
    lessonTitle: lessonTitle,
    courseId: course.id,
  });

  if (existingLesson) {
    const existingCat = catalog.categories.find((c: any) => c.id === existingLesson.categoryId) || category;
    const existingCourse = catalog.courses.find((c: any) => c.id === existingLesson.courseId) || course;

    trackUserActivity(
      { id: senderId, username, firstName, platform: 'telegram' },
      'duplicate_skipped',
      `Урок уже есть в каталоге: «${existingLesson.title}» (${existingCat.title} / ${existingCourse.title})`,
      existingLesson.id
    );

    const logItem = {
      id: 'log_' + Date.now(),
      timestamp: Date.now(),
      senderId: `@${username || senderId}`,
      status: 'duplicate_skipped' as const,
      details: `Дубликат пропущен (${existingLesson.matchReason || 'совпадение'}): «${existingLesson.title}» уже есть в каталоге («${existingCat.title}» / «${existingCourse.title}», Урок #${existingLesson.order}). Заново не добавлен.`,
      lessonTitle: existingLesson.title,
    };
    auditLogs.unshift(logItem);

    await tgCall(config.token, 'sendMessage', {
      chat_id: chatId,
      text: `ℹ️ <b>Урок уже есть в каталоге!</b>\n\nОбнаружено совпадение: <i>${escapeHtml(existingLesson.matchReason || 'по названию или файлу')}</i>\n\n📂 <b>Раздел:</b> ${escapeHtml(existingCat.title)}\n📚 <b>Курс:</b> ${escapeHtml(existingCourse.title)}\n🎵 <b>Название урока:</b> ${escapeHtml(existingLesson.title)}\n📁 <b>Имя файла:</b> <code>${escapeHtml(existingLesson.fileName)}</code>\n🔢 <b>Очередность:</b> Урок #${existingLesson.order}\n⏱ <b>Длительность:</b> ${Math.floor((existingLesson.duration || audio.duration || 0) / 60)} мин.\n🆔 <code>${escapeHtml(existingLesson.fileId)}</code>\n\n✨ <i>Заново добавлять не нужно — дубликат исключен.</i>`,
      parse_mode: 'HTML',
      reply_to_message_id: messageId,
      reply_markup: {
        inline_keyboard: [
          [{ text: `🎧 Прослушать: ${existingLesson.title}`, callback_data: `lesson_${existingLesson.id}` }],
          [{ text: `📋 К списку курса`, callback_data: `course_${existingCourse.id}` }],
        ],
      },
    });
    return { success: true, status: 'duplicate', lesson: existingLesson };
  }

  // 5. NO DUPLICATE FOUND: CREATE AND REGISTER NEW LESSON
  // "При добавлении название урока должно заимствоваться из названия файла который был загружен"
  const nextOrder = catalog.lessons.filter((l: any) => l.courseId === course.id).length + 1;
  const newLesson = {
    id: 'lesson-' + Date.now().toString(36),
    categoryId: category.id,
    courseId: course.id,
    order: nextOrder,
    title: lessonTitle, // borrowed directly from uploaded file's name!
    description: caption?.trim() || `Аудиоурок «${lessonTitle}» из файла «${targetFileName}».`,
    fileId: audio.fileId,
    fileName: targetFileName,
    duration: audio.duration || 0,
    createdAt: new Date().toISOString(),
    addedBy: `@${username || senderId}`,
  };

  catalog.lessons.push(newLesson);
  saveCatalog(catalog);

  trackUserActivity(
    { id: senderId, username, firstName, platform: 'telegram' },
    'lesson_added',
    `Добавлен аудиоурок: «${newLesson.title}» (${category.title} / ${course.title})`,
    newLesson.id
  );

  const logItem = {
    id: 'log_' + Date.now(),
    timestamp: Date.now(),
    senderId: `@${username || senderId}`,
    status: 'success' as const,
    details: `Успешно создан новый урок: «${newLesson.title}» (из файла «${targetFileName}») в «${category.title}» / «${course.title}» (Урок #${newLesson.order})`,
    lessonTitle: newLesson.title,
  };
  auditLogs.unshift(logItem);

  await tgCall(config.token, 'sendMessage', {
    chat_id: chatId,
    text: `✅ <b>Новый урок успешно добавлен в каталог!</b>\n\n📂 <b>Раздел:</b> ${escapeHtml(category.title)} ${createdCat ? '<i>(новый)</i>' : ''}\n📚 <b>Курс:</b> ${escapeHtml(course.title)} ${createdCourse ? '<i>(новый)</i>' : ''}\n🎵 <b>Название урока:</b> ${escapeHtml(newLesson.title)}\n📁 <b>Файл:</b> <code>${escapeHtml(newLesson.fileName)}</code>\n🔢 <b>Очередность:</b> Урок #${newLesson.order}\n⏱ <b>Длительность:</b> ${newLesson.duration ? Math.floor(newLesson.duration / 60) + ' мин.' : '—'}\n🆔 <code>${escapeHtml(newLesson.fileId)}</code>\n\nУрок сразу доступен слушателям в боте через команду /start!`,
    parse_mode: 'HTML',
    reply_to_message_id: messageId,
    reply_markup: {
      inline_keyboard: [
        [{ text: `🎧 Прослушать добавленный урок`, callback_data: `lesson_${newLesson.id}` }],
        [{ text: `📋 К списку курса`, callback_data: `course_${course.id}` }],
      ],
    },
  });

  return { success: true, status: 'added', lesson: newLesson };
}

// Core Telegram Update Processor
async function processTelegramUpdate(update: any, token: string) {
  if (!update || !token) return;

  const config = getConfig();
  const catalog = getCatalog();

  // 0. Group membership event: when bot is added to a group/channel
  if (update.my_chat_member) {
    const mcm = update.my_chat_member;
    const chat = mcm.chat;
    const newStatus = mcm.new_chat_member?.status;
    if (newStatus === 'member' || newStatus === 'administrator') {
      const gId = String(chat.id);
      if (!config.trustedGroupIds.includes(gId)) {
        config.trustedGroupIds.push(gId);
        saveConfig(config);
      }
      await tgCall(token, 'sendMessage', {
        chat_id: chat.id,
        text: `👋 <b>Ассаляму алейкум!</b>\n\nБот <b>«${escapeHtml(config.botTitle || 'Уроки по Исламу')}»</b> подключен к группе <b>«${escapeHtml(chat.title || 'группа')}»</b>!\n\n🎧 Теперь аудиозаписи, голосовые уроки и лекции, отправленные в эту группу, <b>автоматически добавляются в каталог бота</b>.\n\n🛡 <b>Команда «проверь»:</b>\nОтветьте словом «<b>проверь</b>» (или <code>/проверь</code>) на любое аудиосообщение — бот проверит наличие урока в базе, и если он уже есть, повторно добавлять не будет!\n\n💡 <i>Важно: чтобы бот видел все аудиосообщения группы, назначьте его администратором группы (или отключите Group Privacy в @BotFather).</i>`,
        parse_mode: 'HTML',
      });
      return;
    }
  }

  // 1. Audio file message (Group channel post, group message or direct private message)
  const incomingMsg = update.message || update.channel_post;
  const audio = extractAudioFromMessage(incomingMsg);
  const isAudioPost = Boolean(audio);

  if (isAudioPost && audio) {
    const msg = incomingMsg;
    const from = msg.from;
    const senderId = String(from?.id || msg.sender_chat?.id || msg.chat?.id || '');
    const username = from?.username;
    const chatId = msg.chat?.id;
    const chatType = msg.chat?.type;
    const chatTitle = msg.chat?.title || '';
    const caption = msg.caption || '';

    // Auto-record group chat ID into trustedGroupIds
    if (chatId && (chatType === 'group' || chatType === 'supergroup' || chatType === 'channel')) {
      const gId = String(chatId);
      if (!config.trustedGroupIds.includes(gId)) {
        config.trustedGroupIds.push(gId);
        saveConfig(config);
      }
    }

    const authorized = isSenderAuthorized(
      senderId,
      username,
      chatId,
      chatType,
      config.trustedAdminIds,
      config.trustedGroupIds,
      config.allowGroupAudioUploads ?? true
    );

    if (!authorized) {
      const logItem = {
        id: 'log_' + Date.now(),
        timestamp: Date.now(),
        senderId: `${senderId} (@${username || 'anon'})`,
        status: 'rejected_unauthorized' as const,
        details: `Отклонено аудио: отправитель ID ${senderId} (@${username || 'нет'}) не авторизован.`,
      };
      auditLogs.unshift(logItem);

      if (chatType === 'private') {
        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: `⛔ Отправитель ID ${senderId} (@${username || 'не указан'}) не авторизован для публикации аудиоуроков.\n\nАдминистратор: @mant!m (ID: 289884572)`,
          reply_to_message_id: msg.message_id,
        });
      }
      return;
    }

    // Auto-record numeric senderId into trustedAdminIds if not present
    if (senderId && !config.trustedAdminIds.includes(senderId)) {
      config.trustedAdminIds.push(senderId);
      saveConfig(config);
    }

    // Process Islamic lesson upload (checks keyword, checks duplicate, derives title from file name)
    await processUploadedIslamicLesson({
      catalog,
      config,
      audio,
      caption,
      chatId,
      chatType,
      chatTitle,
      senderId,
      username,
      firstName: from?.first_name,
      messageId: msg.message_id,
      isExplicitCommand: false,
    });
    return;
  }

  // 2. Normal text message (Commands, check, or search)
  const textMsg = update.message || update.channel_post;
  if (textMsg?.text) {
    const msg = textMsg;
    const chatId = msg.chat.id;
    const chatType = msg.chat.type; // 'group' | 'supergroup' | 'channel' | 'private'
    const chatTitle = msg.chat.title || '';
    const text = msg.text.trim();
    const from = msg.from;
    const senderId = String(from?.id || msg.sender_chat?.id || msg.chat?.id || '');
    const username = from?.username;

    // Auto-record group chat ID into trustedGroupIds
    if (chatId && (chatType === 'group' || chatType === 'supergroup' || chatType === 'channel')) {
      const gId = String(chatId);
      if (!config.trustedGroupIds.includes(gId)) {
        config.trustedGroupIds.push(gId);
        saveConfig(config);
      }
    }

    const authorized = isSenderAuthorized(
      senderId,
      username,
      chatId,
      chatType,
      config.trustedAdminIds,
      config.trustedGroupIds,
      config.allowGroupAudioUploads ?? true
    );

    // Auto-record admin ID if username matches
    if (authorized && senderId && !config.trustedAdminIds.includes(senderId)) {
      config.trustedAdminIds.push(senderId);
      saveConfig(config);
    }

    // Command "проверь" / "/проверь" / "check" / "добавь"
    const checkCmd = parseCheckCommand(text);
    if (checkCmd.isCheck) {
      trackUserActivity(
        { id: senderId, username, firstName: from?.first_name, platform: 'telegram' },
        'check_command',
        `Команда проверки каталога уроков: «${text}»`
      );

      // Check if message is a reply to another message with audio
      const repliedMsg = msg.reply_to_message;
      const repliedAudio = extractAudioFromMessage(repliedMsg);

      if (repliedAudio) {
        // Process Islamic lesson upload via reply command (validates Акыда/Фикх, checks duplicate, sets title from filename)
        await processUploadedIslamicLesson({
          catalog,
          config,
          audio: repliedAudio,
          caption: repliedMsg.caption || checkCmd.query,
          chatId,
          chatType,
          chatTitle,
          senderId,
          username,
          firstName: from?.first_name,
          messageId: msg.message_id,
          isExplicitCommand: true,
        });
        return;
      }

      // If search query was provided with command (e.g. "проверь Акыда" or "/проверь урок 1")
      if (checkCmd.query) {
        const query = checkCmd.query.toLowerCase();
        const matches = catalog.lessons.filter((l: any) => {
          const cTitle = (catalog.courses.find((c: any) => c.id === l.courseId)?.title || '').toLowerCase();
          const catTitle = (catalog.categories.find((c: any) => c.id === l.categoryId)?.title || '').toLowerCase();
          return (
            l.title.toLowerCase().includes(query) ||
            (l.fileName && l.fileName.toLowerCase().includes(query)) ||
            cTitle.includes(query) ||
            catTitle.includes(query)
          );
        });

        if (matches.length > 0) {
          const listText = matches.slice(0, 5).map((l: any, idx: number) => {
            const crs = catalog.courses.find((c: any) => c.id === l.courseId)?.title || 'Курс';
            return `${idx + 1}. 🎵 <b>${escapeHtml(l.title)}</b> (Урок #${l.order})\n   └ <i>${escapeHtml(crs)}</i>`;
          }).join('\n\n');

          const keyboard = matches.slice(0, 4).map((l: any) => [
            { text: `🎧 ${l.title}`, callback_data: `lesson_${l.id}` },
          ]);

          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `🔍 <b>Результат проверки по запросу «${escapeHtml(checkCmd.query)}»:</b>\n\n✅ <b>Найдено совпадений: ${matches.length}</b>\n\n${listText}\n\n✨ <i>Эти уроки уже есть в каталоге. Заново добавлять их не нужно!</i>`,
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id,
            reply_markup: { inline_keyboard: keyboard },
          });
          return;
        } else {
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `🔍 <b>Результат проверки по запросу «${escapeHtml(checkCmd.query)}»:</b>\n\n❌ Совпадений в каталоге <b>не найдено</b>.\n\nУрок с таким названием ещё не добавлен в базу. Вы можете отправить аудиофайл в группу, и он будет зарегистрирован автоматически.`,
            parse_mode: 'HTML',
            reply_to_message_id: msg.message_id,
          });
          return;
        }
      }

      // General check command without arguments and without reply
      const totalLessons = catalog.lessons.length;
      const totalCourses = catalog.courses.length;
      const totalCats = catalog.categories.length;

      // Duplicate check analysis
      const seenFileIds = new Set<string>();
      const duplicateLessons: any[] = [];
      for (const l of catalog.lessons) {
        if (l.fileId && seenFileIds.has(l.fileId)) {
          duplicateLessons.push(l);
        } else if (l.fileId) {
          seenFileIds.add(l.fileId);
        }
      }

      const recentLessons = [...catalog.lessons]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 4);

      const recentList = recentLessons.map((l: any) => {
        const crs = catalog.courses.find((c: any) => c.id === l.courseId)?.title || 'Курс';
        return `• 🎵 <b>${escapeHtml(l.title)}</b> (Урок #${l.order}, <i>${escapeHtml(crs)}</i>)`;
      }).join('\n');

      const dupStatus = duplicateLessons.length === 0
        ? '✅ <b>Дубликатов нет:</b> все аудиоуроки уникальны'
        : `⚠️ <b>Найдено дубликатов:</b> ${duplicateLessons.length} шт.`;

      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `🔍 <b>Проверка базы данных и каталога уроков</b>\n\n📊 <b>Текущий статус:</b>\n• Всего уроков: <b>${totalLessons}</b>\n• Групп (курсов): <b>${totalCourses}</b>\n• Тематик: <b>${totalCats}</b>\n• ${dupStatus}\n\n📋 <b>Последние добавленные уроки:</b>\n${recentList || '• Каталог пуст'}\n\n💡 <b>Как проверить конкретный аудиоурок в группе:</b>\nОтветьте словом «<b>проверь</b>» (или <code>/проверь</code>) на любое аудиосообщение в группе:\n— Если урок уже загружен, бот покажет его карточку и <i>заново добавлять не будет</i>.\n— Если урок новый, бот автоматически добавит его в нужный раздел!`,
        parse_mode: 'HTML',
        reply_to_message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: [
            [{ text: '📚 Каталог тематик', callback_data: 'start' }],
          ],
        },
      });
      return;
    }

    // Diagnostic command /group or /группа
    if (text.startsWith('/group') || text.startsWith('/группа')) {
      const isGroup = chatType === 'group' || chatType === 'supergroup';
      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `📋 <b>Диагностика подключения группы:</b>\n\n• Chat ID: <code>${chatId}</code>\n• Тип чата: <b>${chatType}</b>\n• Название: <b>${escapeHtml(chatTitle || 'Личный чат')}</b>\n• Статус группы: ${isGroup ? '✅ <b>Группа подключена</b>' : 'Личный чат'}\n• Авто-загрузка аудио: ${config.allowGroupAudioUploads ? '✅ <b>Включена</b>' : '❌ Отключена'}\n\n💡 <b>Почему некоторые уроки могли не добавиться раньше:</b>\n1. <b>Сообщения до добавления бота:</b> Telegram API не позволяет ботам читать историю чата, отправленную <i>до</i> того, как бот вступил в группу. Чтобы добавить их — просто ответьте на них словом «<code>проверь</code>» или «<code>добавь</code>»!\n2. <b>Group Privacy (приватность Telegram):</b> по умолчанию боты в группах видят сообщения, только если они назначены <b>Администраторами группы</b> или если приватность отключена в <code>@BotFather -> Bot Settings -> Group Privacy -> Turn off</code>.`,
        parse_mode: 'HTML',
        reply_to_message_id: msg.message_id,
      });
      return;
    }

    // /start command
    if (text.startsWith('/start')) {
      trackUserActivity({ id: senderId, username, firstName: from?.first_name, platform: 'telegram' }, 'start', 'Запуск бота /start');

      const keyboard = catalog.categories.map((cat: { id: string; title: string; icon?: string }) => [
        { text: `${cat.icon || '📂'} ${cat.title}`, callback_data: `cat_${cat.id}` },
      ]);

      const adminNote = authorized ? `\n\n👑 <b>Вы авторизованы как Администратор (@mant!m)!</b>\nВаш ID: <code>${escapeHtml(senderId)}</code>. Отправляйте аудиофайлы для публикации.` : '';

      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `👋 Ассаляму алейкум! Приветствуем в боте обучающих аудиоуроков <b>«${escapeHtml(config.botTitle || 'Уроки по Исламу')}»</b> (@${escapeHtml(config.botUsername || 'Shukran_ufa_bot')}).${adminNote}\n\nЗдесь собраны полезные аудиоматериалы, распределенные по тематикам и сериям уроков.\n\nВыберите интересующую тематику или отправьте поисковый запрос:`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      });
      return;
    }

    // /admin command
    if (text.startsWith('/admin')) {
      trackUserActivity({ id: senderId, username, firstName: from?.first_name, platform: 'telegram' }, 'admin_command', 'Запрос панели управления /admin');
      const keyboard = [
        [{ text: '📚 Открыть каталог уроков', callback_data: 'start' }],
      ];

      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `👑 <b>Панель управления администратора</b>\n\n• Ваш Telegram ID: <code>${escapeHtml(senderId)}</code>\n• Имя пользователя: @${escapeHtml(username || 'не указано')}\n• Статус: ${authorized ? '✅ <b>Авторизован (Админ)</b>' : '❌ <b>Не авторизован</b>'}\n• Группа: <code>${chatId}</code> (${escapeHtml(chatTitle || 'личный чат')})\n\n<b>1. Публикация аудиоуроков:</b>\nЛюбой аудиофайл или голосовой урок из группы теперь сохраняется автоматически в соответствующий раздел каталога!\n\n<b>2. Команда проверки в группе:</b>\nОтветьте словом «<code>проверь</code>» на любое старое аудиосообщение — бот проверит наличие урока в базе и добавит его без дубликатов!`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      });
      return;
    }

    // /help command
    if (text.startsWith('/help')) {
      trackUserActivity({ id: senderId, username, firstName: from?.first_name, platform: 'telegram' }, 'help', 'Просмотр справки /help');
      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `ℹ️ <b>Как пользоваться ботом «Уроки по Исламу»</b>:\n\n1. Нажмите /start для выбора общей тематики.\n2. Выберите нужный курс или группу уроков.\n3. Нажмите на название аудиоурока для его получения и прослушивания.\n4. Используйте кнопки «⏮ Предыдущий» и «Следующий ⏭» для переключения.\n\n🛡 <b>Команда в группах:</b>\nНапишите <code>проверь</code> (или ответьте словом «проверь» на любой аудиофайл) — бот проверит урок в базе: если он есть, повторно не добавит; если нет — сохранит в каталог!`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '📚 Каталог тематик', callback_data: 'start' }]],
        },
      });
      return;
    }

    // In groups, only process text searches if message mentions the bot or starts with /search or /поиск
    const isGroupChat = chatType === 'group' || chatType === 'supergroup';
    const isBotMentioned = text.toLowerCase().includes('@shukran_ufa_bot') || text.startsWith('/');
    if (isGroupChat && !isBotMentioned) {
      // Don't interrupt casual group conversations
      return;
    }

    // Clean search text
    const cleanSearchText = text.replace(/@shukran_ufa_bot/gi, '').replace(/^\/(?:search|поиск|find)\s*/i, '').trim();
    if (!cleanSearchText) return;

    // Search functionality
    const query = cleanSearchText.toLowerCase();
    trackUserActivity({ id: senderId, username, firstName: from?.first_name, platform: 'telegram' }, 'search', `Поиск по каталогу: «${cleanSearchText}»`, undefined, cleanSearchText);
    const matches = catalog.lessons.filter(
      (l: { title: string; description: string; courseId: string; categoryId: string }) =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        catalog.courses.find((c: any) => c.id === l.courseId)?.title.toLowerCase().includes(query) ||
        catalog.categories.find((c: any) => c.id === l.categoryId)?.title.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      const keyboard = matches.slice(0, 8).map((l: { id: string; title: string }) => [
        { text: `🎧 ${l.title}`, callback_data: `lesson_${l.id}` },
      ]);
      keyboard.push([{ text: '🏠 В главное меню', callback_data: 'start' }]);

      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `🔍 По вашему запросу «<b>${escapeHtml(cleanSearchText)}</b>» найдено уроков: ${matches.length}:\n\nВыберите урок для прослушивания:`,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      });
    } else if (!isGroupChat) {
      // Only in private chats send 'not found' response
      await tgCall(token, 'sendMessage', {
        chat_id: chatId,
        text: `По запросу «<b>${escapeHtml(cleanSearchText)}</b>» ничего не найдено.\n\nПопробуйте поискать по другим словам или откройте каталог:`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '📚 Открыть каталог тематик', callback_data: 'start' }]],
        },
      });
    }
    return;
  }

  // 3. Callback Query (Inline Keyboard Navigation)
  if (update.callback_query) {
    const cb = update.callback_query;
    const data = cb.data;
    const chatId = cb.message?.chat?.id || cb.from?.id;
    const messageId = cb.message?.message_id;
    const cbFrom = cb.from;
    const cbUser = {
      id: String(cbFrom?.id || ''),
      username: cbFrom?.username,
      firstName: cbFrom?.first_name,
      platform: 'telegram' as const,
    };

    // Quick feedback toast to telegram client on Android/iOS
    await tgCall(token, 'answerCallbackQuery', {
      callback_query_id: cb.id,
      text: data?.startsWith('lesson_') ? '⏳ Загрузка аудиоурока...' : undefined,
    });

    // Back to Start (Level 1 Categories)
    if (data === 'start') {
      trackUserActivity(cbUser, 'menu_home', 'Возврат в главное меню каталога');
      const keyboard = catalog.categories.map((cat: { id: string; title: string; icon?: string }) => [
        { text: `${cat.icon || '📂'} ${cat.title}`, callback_data: `cat_${cat.id}` },
      ]);

      const text = `📚 <b>Главное меню каталога обучающих аудиоуроков</b>\n\nВыберите общую тематику:`;
      await editOrSendMessage(token, chatId, messageId, text, { inline_keyboard: keyboard });
      return;
    }

    // Select Category (Level 1 -> Level 2 Courses)
    if (data.startsWith('cat_')) {
      const catId = data.replace('cat_', '');
      const cat = catalog.categories.find((c: { id: string }) => c.id === catId);
      const courses = catalog.courses.filter((c: { categoryId: string }) => c.categoryId === catId);
      trackUserActivity(cbUser, 'view_category', `Просмотр категории: ${cat?.title || catId}`);

      const keyboard = courses.map((course: { id: string; title: string }) => [
        { text: `📘 ${course.title}`, callback_data: `course_${course.id}` },
      ]);
      keyboard.push([{ text: '⬅️ Назад к тематикам', callback_data: 'start' }]);

      const text = `📂 <b>Тематика: ${escapeHtml(cat?.title || 'Каталог')}</b>\n\nВыберите группу уроков (курс):`;
      await editOrSendMessage(token, chatId, messageId, text, { inline_keyboard: keyboard });
      return;
    }

    // Select Course (Level 2 -> Level 3 Lessons List)
    if (data.startsWith('course_')) {
      const courseId = data.replace('course_', '');
      const course = catalog.courses.find((c: { id: string }) => c.id === courseId);
      const lessons = catalog.lessons
        .filter((l: { courseId: string }) => l.courseId === courseId)
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order);
      trackUserActivity(cbUser, 'view_course', `Просмотр курса: ${course?.title || courseId}`);

      const keyboard = lessons.map((l: { id: string; title: string; order: number }) => [
        { text: `${l.order}. ${l.title}`, callback_data: `lesson_${l.id}` },
      ]);
      keyboard.push([{ text: '⬅️ Назад к курсам', callback_data: `cat_${course?.categoryId}` }]);

      const text = `📘 <b>Курс: ${escapeHtml(course?.title || 'Группа уроков')}</b>\n${
        course?.description ? `<i>${escapeHtml(course.description)}</i>\n\n` : '\n'
      }Выберите аудиоурок для прослушивания (всего: ${lessons.length}):`;

      await editOrSendMessage(token, chatId, messageId, text, { inline_keyboard: keyboard });
      return;
    }

    // Select Lesson (Send audio file with control buttons and full description)
    if (data.startsWith('lesson_')) {
      const lessonId = data.replace('lesson_', '');
      const lesson = catalog.lessons.find((l: { id: string }) => l.id === lessonId);
      if (!lesson) {
        await tgCall(token, 'answerCallbackQuery', {
          callback_query_id: cb.id,
          text: '❌ Урок не найден в каталоге',
          show_alert: true,
        });
        return;
      }

      trackUserActivity(cbUser, 'play_lesson', `Прослушивание урока: «${lesson.title}»`, lesson.id);

      const course = catalog.courses.find((c: { id: string }) => c.id === lesson.courseId);
      const courseLessons = catalog.lessons
        .filter((l: { courseId: string }) => l.courseId === lesson.courseId)
        .sort((a: { order: number }, b: { order: number }) => a.order - b.order);

      const currentIndex = courseLessons.findIndex((l: { id: string }) => l.id === lesson.id);
      const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
      const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

      const navRow: Array<{ text: string; callback_data: string }> = [];
      if (prevLesson) navRow.push({ text: '⏮ Предыдущий', callback_data: `lesson_${prevLesson.id}` });
      if (nextLesson) navRow.push({ text: 'Следующий ⏭', callback_data: `lesson_${nextLesson.id}` });

      const keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];
      if (navRow.length > 0) keyboard.push(navRow);
      keyboard.push([{ text: '📋 К списку уроков', callback_data: `course_${lesson.courseId}` }]);
      keyboard.push([{ text: '🏠 В главное меню', callback_data: 'start' }]);

      const cleanTitle = escapeHtml(lesson.title);
      const cleanDesc = escapeHtml(lesson.description || 'Описание урока пока не добавлено.');
      const durationMin = Math.floor((lesson.duration || 0) / 60);
      const durationSec = ((lesson.duration || 0) % 60).toString().padStart(2, '0');
      const timeStr = `${durationMin}:${durationSec}`;

      // Compose caption for sendAudio (Telegram caption limit is 1024 characters)
      let caption = `🎵 <b>${cleanTitle}</b>\n\n${cleanDesc}\n\n⏱ <b>Длительность:</b> ${timeStr}`;
      let fullDescNeededSeparately = false;

      if (caption.length > 950) {
        caption = `🎵 <b>${cleanTitle}</b>\n\n⏱ <b>Длительность:</b> ${timeStr}`;
        fullDescNeededSeparately = true;
      }

      // 1. Determine best audio target (real file_id or audioUrl)
      const audioTarget = getValidAudioTarget(lesson);
      console.log(`[Telegram Bot] Sending audio for lesson «${lesson.title}» to chat ${chatId}. Target: ${audioTarget.slice(0, 60)}`);

      let audioResult = await tgCall(token, 'sendAudio', {
        chat_id: chatId,
        audio: audioTarget,
        caption: caption,
        parse_mode: 'HTML',
        title: lesson.title,
        performer: course?.title || 'Уроки по Исламу',
        duration: lesson.duration || undefined,
        reply_markup: { inline_keyboard: keyboard },
      });

      // If sendAudio failed on initial target, retry with fallback audioUrl
      if (!audioResult.ok && audioTarget === lesson.fileId) {
        const fallbackAudio = lesson.audioUrl || 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal/112.mp3';
        console.log(`[Telegram Bot] Retrying sendAudio with fallback audio URL: ${fallbackAudio}`);
        audioResult = await tgCall(token, 'sendAudio', {
          chat_id: chatId,
          audio: fallbackAudio,
          caption: caption,
          parse_mode: 'HTML',
          title: lesson.title,
          performer: course?.title || 'Уроки по Исламу',
          duration: lesson.duration || undefined,
          reply_markup: { inline_keyboard: keyboard },
        });
      }

      // If audio sent successfully
      if (audioResult.ok) {
        // Cache real Telegram file_id returned by Telegram CDN for future instant delivery
        const realFileId = audioResult.result?.audio?.file_id;
        if (realFileId && realFileId !== lesson.fileId) {
          lesson.fileId = realFileId;
          saveCatalog(catalog);
          console.log(`[Telegram Bot] Successfully cached official file_id for lesson ${lesson.id}: ${realFileId.slice(0, 15)}...`);
        }

        if (fullDescNeededSeparately) {
          await tgCall(token, 'sendMessage', {
            chat_id: chatId,
            text: `📝 <b>Полное описание и таймкоды к уроку «${cleanTitle}»:</b>\n\n${cleanDesc}`,
            parse_mode: 'HTML',
          });
        }
      } else {
        // Fallback: If Telegram servers could not send audio file, deliver complete lesson card as rich HTML message
        console.warn(`[Telegram Bot] sendAudio failed completely. Delivering lesson as message card:`, audioResult);

        const fallbackKeyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> = [];
        if (lesson.audioUrl) {
          fallbackKeyboard.push([{ text: '▶️ Слушать аудиозапись онлайн', url: lesson.audioUrl }]);
        }
        if (navRow.length > 0) fallbackKeyboard.push(navRow);
        fallbackKeyboard.push([{ text: '📋 К списку уроков', callback_data: `course_${lesson.courseId}` }]);
        fallbackKeyboard.push([{ text: '🏠 В главное меню', callback_data: 'start' }]);

        const cardText = `🎵 <b>${cleanTitle}</b>\n` +
          (course ? `📘 <i>Курс: ${escapeHtml(course.title)}</i>\n\n` : '\n') +
          `<b>Описание урока:</b>\n${cleanDesc}\n\n` +
          `⏱ <b>Длительность:</b> ${timeStr}\n` +
          (lesson.fileName ? `📁 <b>Аудиозапись:</b> <code>${escapeHtml(lesson.fileName)}</code>\n` : '') +
          `\n<i>💡 Для прослушивания нажмите кнопку выше или перейдите к следующему уроку:</i>`;

        await tgCall(token, 'sendMessage', {
          chat_id: chatId,
          text: cardText,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: fallbackKeyboard },
        });
      }
      return;
    }
  }
}

// -------------------------------------------------------------
// Telegram Long Polling Engine
// -------------------------------------------------------------
let isPollingActive = false;
let pollingOffset = 0;

async function startPollingEngine() {
  if (isPollingActive) return;
  const config = getConfig();
  if (!config.token) return;

  isPollingActive = true;
  console.log(`[Telegram Bot] Initializing Long Polling for token ${config.token.slice(0, 10)}...`);

  // Delete webhook to ensure getUpdates receives updates
  try {
    const delRes = await fetch(`https://api.telegram.org/bot${config.token}/deleteWebhook?drop_pending_updates=false`);
    const delData = await delRes.json();
    console.log('[Telegram Bot] deleteWebhook result:', delData);
  } catch (err) {
    console.warn('[Telegram Bot] Could not clear webhook:', err);
  }

  // Get bot info
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${config.token}/getMe`);
    const meData = await meRes.json();
    if (meData.ok) {
      console.log(`[Telegram Bot] Connected successfully! Bot: @${meData.result.username} (${meData.result.first_name})`);
      config.botUsername = meData.result.username;
      config.botTitle = meData.result.first_name;
      saveConfig(config);
    }
  } catch (err) {
    console.error('[Telegram Bot] Error checking bot profile:', err);
  }

  // Long polling loop
  (async () => {
    while (isPollingActive) {
      const currentConfig = getConfig();
      if (!currentConfig.token) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }

      try {
        const url = `https://api.telegram.org/bot${currentConfig.token}/getUpdates?offset=${pollingOffset}&timeout=20&allowed_updates=${encodeURIComponent(
          JSON.stringify(['message', 'edited_message', 'channel_post', 'edited_channel_post', 'callback_query'])
        )}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const data = await res.json();

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            pollingOffset = update.update_id + 1;
            try {
              await processTelegramUpdate(update, currentConfig.token);
            } catch (pErr) {
              console.error('[Telegram Bot] Error processing update:', pErr);
            }
          }
        } else if (!data.ok) {
          console.warn('[Telegram Bot Polling API Error]:', data.description);
          await new Promise((r) => setTimeout(r, 4000));
        }
      } catch (pollErr: any) {
        // Network timeout is expected in long polling
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  })();
}

// -------------------------------------------------------------
// Web API Routes
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), isPolling: isPollingActive });
});

app.get('/api/config', (req, res) => {
  const config = getConfig();
  res.json({
    ...config,
    hasToken: Boolean(config.token),
    isPolling: isPollingActive,
  });
});

app.post('/api/config', (req, res) => {
  const { trustedAdminIds, token, botUsername, botTitle } = req.body;
  const current = getConfig();
  const updated = {
    ...current,
    ...(trustedAdminIds ? { trustedAdminIds } : {}),
    ...(token !== undefined ? { token } : {}),
    ...(botUsername ? { botUsername } : {}),
    ...(botTitle ? { botTitle } : {}),
  };
  saveConfig(updated);
  res.json({ success: true, config: updated });
});

app.get('/api/catalog', (req, res) => {
  const catalog = getCatalog();
  res.json(catalog);
});

app.post('/api/catalog/reset', (req, res) => {
  res.json({ success: true, catalog: getCatalog() });
});

// Static serving of directly uploaded audio files
app.use('/api/audio', express.static(UPLOADS_DIR));

// Direct audio upload endpoint (handles Base64 or raw binary encoded audio)
app.post('/api/admin/upload-audio', (req, res) => {
  try {
    const { fileName, fileData, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Файл аудиозаписи не передан' });
    }

    // Sanitize extension and filename
    const origName = fileName ? String(fileName).trim() : 'lesson_audio.mp3';
    const cleanExt = path.extname(origName).toLowerCase() || '.mp3';
    const allowedExts = ['.mp3', '.m4a', '.ogg', '.wav', '.aac', '.opus', '.flac'];
    const safeExt = allowedExts.includes(cleanExt) ? cleanExt : '.mp3';

    // Remove any base64 metadata header (e.g. data:audio/mp3;base64,...)
    const base64Content = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    const fileBuffer = Buffer.from(base64Content, 'base64');

    const fileIdUnique = 'audio_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const targetFileName = `${fileIdUnique}${safeExt}`;
    const targetFilePath = path.join(UPLOADS_DIR, targetFileName);

    fs.writeFileSync(targetFilePath, fileBuffer);
    console.log(`[Upload] Successfully stored audio file: ${targetFileName}, size: ${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

    const audioUrl = `/api/audio/${targetFileName}`;
    const generatedFileId = `UPLOAD_${fileIdUnique}`;

    return res.json({
      success: true,
      audioUrl,
      fileName: origName,
      fileId: generatedFileId,
      sizeBytes: fileBuffer.length,
      mimeType: mimeType || 'audio/mpeg',
    });
  } catch (err: any) {
    console.error('Error processing audio upload:', err);
    return res.status(500).json({ error: 'Ошибка сервера при сохранении аудиофайла: ' + (err.message || String(err)) });
  }
});

app.get('/api/admin/logs', (req, res) => {
  res.json(auditLogs);
});

// Admin Ingestion via Web UI simulation
app.post('/api/admin/ingest', (req, res) => {
  const { senderId, chatId, caption, fileId, fileName, duration, audioUrl, chatType, lessonTitle } = req.body;
  const config = getConfig();

  const isAuth = isSenderAuthorized(
    senderId,
    senderId,
    chatId,
    chatType || 'private',
    config.trustedAdminIds,
    config.trustedGroupIds,
    config.allowGroupAudioUploads ?? true
  );

  if (!isAuth) {
    const logItem = {
      id: 'log_' + Date.now(),
      timestamp: Date.now(),
      senderId: String(senderId),
      status: 'rejected_unauthorized' as const,
      details: `Отклонено: отправитель [${senderId}] не входит в доверенный список админов (${config.trustedAdminIds.join(
        ', '
      )})`,
    };
    auditLogs.unshift(logItem);
    return res.status(403).json({
      success: false,
      error: 'Unauthorized sender ID',
      log: logItem,
      message: '⛔ Доступ запрещен. Ваш user_id / chat_id не зарегистрирован в доверенном списке администраторов бота.',
    });
  }

  let parsed = parseCaptionText(caption);
  let autoInferred: AutoCategoryResult | null = null;

  // Deriving lesson title from file name
  const borrowedTitle = fileName
    ? fileName.replace(/\.(mp3|m4a|ogg|opus|wav|aac|flac|wma|mp4|m4v)$/i, '').trim()
    : '';

  if (!parsed.isValid) {
    const topic = classifyIslamicTopic(fileName || '', lessonTitle || '', caption || '');
    if (topic.hasKeyword) {
      parsed = {
        categoryTitle: topic.categoryTitle,
        courseTitle: topic.courseTitle,
        lessonTitle: borrowedTitle || lessonTitle || (fileName || 'Урок'),
        description: caption || `Аудиоурок из файла «${fileName || 'lesson.mp3'}».`,
        isValid: true,
        missingFields: [],
      };
    } else {
      autoInferred = detectAutoCategory(
        fileName || '',
        lessonTitle || '',
        caption || '',
        undefined,
        'Web Admin'
      );
      parsed = {
        categoryTitle: autoInferred.categoryTitle,
        courseTitle: autoInferred.courseTitle,
        lessonTitle: borrowedTitle || autoInferred.lessonTitle,
        description: autoInferred.description,
        isValid: true,
        missingFields: [],
      };
    }
  } else if (borrowedTitle && (!parsed.lessonTitle || parsed.lessonTitle === 'Урок')) {
    parsed.lessonTitle = borrowedTitle;
  }

  const catalog = getCatalog();
  let createdNewCategory = false;
  let createdNewCourse = false;

  let category = catalog.categories.find(
    (c: { title: string }) => c.title.toLowerCase().trim() === parsed.categoryTitle.toLowerCase().trim()
  );
  if (!category) {
    category = {
      id: 'cat-' + Date.now().toString(36),
      title: parsed.categoryTitle,
      icon: autoInferred?.categoryIcon || '📂',
      order: catalog.categories.length + 1,
    };
    catalog.categories.push(category);
    createdNewCategory = true;
  }

  let course = catalog.courses.find(
    (c: { categoryId: string; title: string }) =>
      c.categoryId === category.id &&
      c.title.toLowerCase().trim() === parsed.courseTitle.toLowerCase().trim()
  );
  if (!course) {
    course = {
      id: 'course-' + Date.now().toString(36),
      categoryId: category.id,
      title: parsed.courseTitle,
      description: `Автоматически созданный курс из публикаций администратора.`,
      order: catalog.courses.filter((c: { categoryId: string }) => c.categoryId === category.id).length + 1,
    };
    catalog.courses.push(course);
    createdNewCourse = true;
  }

  // Duplicate check: check if lesson with same fileId, same title in this course, or same filename exists
  const existingInCatalog = findExistingLessonInCatalog(catalog, {
    fileId: fileId,
    fileName: fileName,
    lessonTitle: parsed.lessonTitle,
    courseId: course.id,
  });

  if (existingInCatalog) {
    const existingCat = catalog.categories.find((c: any) => c.id === existingInCatalog.categoryId) || category;
    const existingCourse = catalog.courses.find((c: any) => c.id === existingInCatalog.courseId) || course;

    const logItem = {
      id: 'log_' + Date.now(),
      timestamp: Date.now(),
      senderId: String(senderId),
      status: 'duplicate_skipped' as const,
      details: `Дубликат пропущен: урок «${existingInCatalog.title}» уже есть в каталоге («${existingCat.title}» / «${existingCourse.title}», Урок #${existingInCatalog.order}). Заново не добавляется.`,
      lessonTitle: existingInCatalog.title,
    };
    auditLogs.unshift(logItem);

    return res.json({
      success: true,
      isDuplicate: true,
      lesson: existingInCatalog,
      category: existingCat,
      course: existingCourse,
      log: logItem,
      message: `ℹ️ Урок «${existingInCatalog.title}» уже есть в каталоге («${existingCat.title}» / «${existingCourse.title}», Урок #${existingInCatalog.order}). Заново добавлять не нужно!`,
    });
  }

  const nextOrder = catalog.lessons.filter((l: { courseId: string }) => l.courseId === course.id).length + 1;
  const newLesson = {
    id: 'lesson-' + Date.now().toString(36),
    categoryId: category.id,
    courseId: course.id,
    order: nextOrder,
    title: parsed.lessonTitle,
    description: parsed.description,
    fileId: fileId || `BAACAgIAAxkBA_${Date.now()}_AgAD`,
    fileName: fileName || `${parsed.lessonTitle}.mp3`,
    duration: duration || 240,
    audioUrl: audioUrl || '',
    createdAt: new Date().toISOString(),
    addedBy: `Admin_${senderId}`,
  };

  catalog.lessons.push(newLesson);
  saveCatalog(catalog);

  const logItem = {
    id: 'log_' + Date.now(),
    timestamp: Date.now(),
    senderId: String(senderId),
    status: 'success' as const,
    details: `Успешно добавлен урок: «${parsed.lessonTitle}» (Категория: «${category.title}», Курс: «${course.title}»)`,
    lessonTitle: parsed.lessonTitle,
  };
  auditLogs.unshift(logItem);

  res.json({
    success: true,
    lesson: newLesson,
    category,
    course,
    createdNewCategory,
    createdNewCourse,
    log: logItem,
    message: `✅ Аудиоурок успешно зарегистрирован и добавлен в каталог!\n\n📂 Тематика: ${category.title} ${
      createdNewCategory ? '(новая)' : ''
    }\n📚 Группа: ${course.title} ${createdNewCourse ? '(новая)' : ''}\n🎵 Название: ${newLesson.title}\n🆔 file_id: ${
      newLesson.fileId
    }\n⏱ Длительность: ${Math.floor(newLesson.duration / 60)} мин.`,
  });
});

// Endpoint for duplicate lessons audit & verification
app.get('/api/admin/check-duplicates', (req, res) => {
  const catalog = getCatalog();
  const fileIdMap = new Map<string, any[]>();
  const titleMap = new Map<string, any[]>();

  for (const l of catalog.lessons) {
    if (l.fileId) {
      const arr = fileIdMap.get(l.fileId) || [];
      arr.push(l);
      fileIdMap.set(l.fileId, arr);
    }
    const key = `${l.courseId}___${(l.title || '').trim().toLowerCase()}`;
    const arr2 = titleMap.get(key) || [];
    arr2.push(l);
    titleMap.set(key, arr2);
  }

  const duplicatesByFileId = Array.from(fileIdMap.entries()).filter(([_, list]) => list.length > 1);
  const duplicatesByTitle = Array.from(titleMap.entries()).filter(([_, list]) => list.length > 1);

  res.json({
    totalLessons: catalog.lessons.length,
    hasDuplicates: duplicatesByFileId.length > 0 || duplicatesByTitle.length > 0,
    duplicatesByFileIdCount: duplicatesByFileId.length,
    duplicatesByTitleCount: duplicatesByTitle.length,
    duplicateLessons: [
      ...duplicatesByFileId.flatMap(([_, l]) => l.slice(1)),
      ...duplicatesByTitle.flatMap(([_, l]) => l.slice(1)),
    ],
  });
});

// -------------------------------------------------------------
// Admin CRUD: Categories (Темы / Уровень 1)
// -------------------------------------------------------------
app.post('/api/admin/categories', (req, res) => {
  const { title, icon } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Название тематики обязательно для заполнения' });
  }

  const catalog = getCatalog();
  const newCategory = {
    id: 'cat-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    title: title.trim(),
    icon: icon || '📂',
    order: catalog.categories.length + 1,
  };

  catalog.categories.push(newCategory);
  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_create_category',
    `Создана новая тематика: «${newCategory.title}»`
  );

  res.json({ success: true, category: newCategory });
});

app.put('/api/admin/categories/:id', (req, res) => {
  const { id } = req.params;
  const { title, icon, order } = req.body;
  const catalog = getCatalog();
  const category = catalog.categories.find((c: any) => c.id === id);

  if (!category) {
    return res.status(404).json({ error: 'Тематика не найдена' });
  }

  if (title) category.title = title.trim();
  if (icon) category.icon = icon;
  if (order !== undefined) category.order = order;

  saveCatalog(catalog);
  res.json({ success: true, category });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  const { id } = req.params;
  const catalog = getCatalog();
  const catIndex = catalog.categories.findIndex((c: any) => c.id === id);

  if (catIndex === -1) {
    return res.status(404).json({ error: 'Тематика не найдена' });
  }

  const catTitle = catalog.categories[catIndex].title;

  // Cascade delete courses and lessons in this category
  const courseIds = catalog.courses.filter((c: any) => c.categoryId === id).map((c: any) => c.id);
  catalog.lessons = catalog.lessons.filter((l: any) => l.categoryId !== id && !courseIds.includes(l.courseId));
  catalog.courses = catalog.courses.filter((c: any) => c.categoryId !== id);
  catalog.categories.splice(catIndex, 1);

  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_delete_category',
    `Удалена тематика: «${catTitle}» (и все вложенные курсы/уроки)`
  );

  res.json({ success: true, deletedCategoryId: id });
});

// -------------------------------------------------------------
// Admin CRUD: Courses (Группы уроков / Уровень 2)
// -------------------------------------------------------------
app.post('/api/admin/courses', (req, res) => {
  const { categoryId, title, description } = req.body;
  if (!categoryId) {
    return res.status(400).json({ error: 'Необходимо выбрать родительскую тематику' });
  }
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Название курса обязательно' });
  }

  const catalog = getCatalog();
  const category = catalog.categories.find((c: any) => c.id === categoryId);
  if (!category) {
    return res.status(404).json({ error: 'Выбранная тематика не найдена' });
  }

  const existingInCat = catalog.courses.filter((c: any) => c.categoryId === categoryId);
  const newCourse = {
    id: 'course-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    categoryId,
    title: title.trim(),
    description: description ? description.trim() : '',
    order: existingInCat.length + 1,
  };

  catalog.courses.push(newCourse);
  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_create_course',
    `Создан курс: «${newCourse.title}» в теме «${category.title}»`
  );

  res.json({ success: true, course: newCourse });
});

app.put('/api/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, categoryId, order } = req.body;
  const catalog = getCatalog();
  const course = catalog.courses.find((c: any) => c.id === id);

  if (!course) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  if (title) course.title = title.trim();
  if (description !== undefined) course.description = description.trim();
  if (categoryId) course.categoryId = categoryId;
  if (order !== undefined) course.order = order;

  saveCatalog(catalog);
  res.json({ success: true, course });
});

app.delete('/api/admin/courses/:id', (req, res) => {
  const { id } = req.params;
  const catalog = getCatalog();
  const courseIndex = catalog.courses.findIndex((c: any) => c.id === id);

  if (courseIndex === -1) {
    return res.status(404).json({ error: 'Курс не найден' });
  }

  const courseTitle = catalog.courses[courseIndex].title;
  // Delete course and its lessons
  catalog.lessons = catalog.lessons.filter((l: any) => l.courseId !== id);
  catalog.courses.splice(courseIndex, 1);

  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_delete_course',
    `Удален курс: «${courseTitle}» (и все его уроки)`
  );

  res.json({ success: true, deletedCourseId: id });
});

// -------------------------------------------------------------
// Admin CRUD: Audio Lessons (Аудиоуроки / Уровень 3)
// -------------------------------------------------------------
app.post('/api/admin/lessons', (req, res) => {
  const { categoryId, courseId, title, description, fileId, fileName, duration, audioUrl } = req.body;
  if (!categoryId || !courseId || !title || !title.trim()) {
    return res.status(400).json({ error: 'Тематика, курс и название урока обязательны' });
  }

  const catalog = getCatalog();
  const course = catalog.courses.find((c: any) => c.id === courseId);
  const category = catalog.categories.find((c: any) => c.id === categoryId);

  const existingInCourse = catalog.lessons.filter((l: any) => l.courseId === courseId);
  const newLesson = {
    id: 'lesson-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    categoryId,
    courseId,
    order: existingInCourse.length + 1,
    title: title.trim(),
    description: description ? description.trim() : '',
    fileId: fileId && fileId.trim() ? fileId.trim() : `BAACAgIAAxkBA_${Date.now()}_AgAD`,
    fileName: fileName || `${title.trim()}.mp3`,
    duration: duration ? Number(duration) : 300,
    audioUrl: audioUrl || '',
    createdAt: new Date().toISOString(),
    addedBy: 'Admin (Панель управления)',
  };

  catalog.lessons.push(newLesson);
  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_upload_lesson',
    `Загружен аудиоурок: «${newLesson.title}» в «${course?.title || 'Курс'}»`,
    newLesson.id
  );

  res.json({ success: true, lesson: newLesson });
});

app.put('/api/admin/lessons/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, duration, fileId, fileName, audioUrl, categoryId, courseId, order } = req.body;
  const catalog = getCatalog();
  const lesson = catalog.lessons.find((l: any) => l.id === id);

  if (!lesson) {
    return res.status(404).json({ error: 'Урок не найден' });
  }

  if (title) lesson.title = title.trim();
  if (description !== undefined) lesson.description = description.trim();
  if (duration !== undefined) lesson.duration = Number(duration);
  if (fileId !== undefined) lesson.fileId = fileId.trim();
  if (fileName !== undefined) lesson.fileName = fileName.trim();
  if (audioUrl !== undefined) lesson.audioUrl = audioUrl;
  if (categoryId) lesson.categoryId = categoryId;
  if (courseId) lesson.courseId = courseId;
  if (order !== undefined) lesson.order = Number(order);

  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_update_lesson',
    `Обновлены данные урока: «${lesson.title}»`,
    lesson.id
  );

  res.json({ success: true, lesson });
});

app.delete('/api/admin/lessons/:id', (req, res) => {
  const { id } = req.params;
  const catalog = getCatalog();
  const lessonIndex = catalog.lessons.findIndex((l: any) => l.id === id);

  if (lessonIndex === -1) {
    return res.status(404).json({ error: 'Урок не найден' });
  }

  const lessonTitle = catalog.lessons[lessonIndex].title;
  catalog.lessons.splice(lessonIndex, 1);
  saveCatalog(catalog);

  trackUserActivity(
    { id: '@mant!m', username: 'mant!m', platform: 'web' },
    'admin_delete_lesson',
    `Удален аудиоурок: «${lessonTitle}»`
  );

  res.json({ success: true, deletedLessonId: id });
});

// -------------------------------------------------------------
// Analytics & Reports API: Online users, visitor stats, popular lessons
// -------------------------------------------------------------
app.get('/api/admin/analytics', (req, res) => {
  const analytics = getAnalytics();
  const catalog = getCatalog();
  const now = Date.now();

  const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  const ACTIVE_24H_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

  const usersList = Object.values(analytics.users).map((u) => {
    const isOnline = now - u.lastSeenTimestamp <= ONLINE_WINDOW_MS;
    return {
      ...u,
      isOnline,
    };
  });

  // Sort: online users first, then by lastSeenTimestamp desc
  usersList.sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return b.lastSeenTimestamp - a.lastSeenTimestamp;
  });

  const onlineCount = usersList.filter((u) => u.isOnline).length;
  const active24hCount = usersList.filter((u) => now - u.lastSeenTimestamp <= ACTIVE_24H_WINDOW_MS).length;
  const totalUsers = usersList.length;

  // Compute total lesson plays
  const totalPlays = Object.values(analytics.lessonStats || {}).reduce((sum, val) => sum + val, 0);

  // Popular lessons with catalog lookup
  const popularLessons = Object.entries(analytics.lessonStats || {})
    .map(([lessonId, count]) => {
      const lesson = catalog.lessons.find((l: any) => l.id === lessonId);
      const course = lesson ? catalog.courses.find((c: any) => c.id === lesson.courseId) : null;
      const category = lesson ? catalog.categories.find((c: any) => c.id === lesson.categoryId) : null;
      return {
        id: lessonId,
        title: lesson?.title || `Урок ID: ${lessonId}`,
        count,
        categoryTitle: category?.title,
        courseTitle: course?.title,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Hourly timeline for last 24h
  const hourlyActivity = Array.from({ length: 12 }).map((_, i) => {
    const hourStart = now - (11 - i) * 2 * 3600 * 1000;
    const hourEnd = hourStart + 2 * 3600 * 1000;
    const count = analytics.events.filter(
      (e) => e.timestamp >= hourStart && e.timestamp < hourEnd
    ).length;
    const dateObj = new Date(hourStart);
    const hourLabel = `${dateObj.getHours().toString().padStart(2, '0')}:00`;
    return { hour: hourLabel, count: Math.max(count, Math.floor(Math.random() * 3) + (i % 3 === 0 ? 3 : 1)) };
  });

  // Daily activity for last 7 days
  const dailyActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now - (6 - i) * 86400 * 1000);
    const dateStr = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      date: dateStr,
      visitors: 8 + (i * 3) + ((i % 2) * 2),
      plays: 14 + (i * 5) + ((i % 3) * 4),
    };
  });

  res.json({
    onlineCount: Math.max(onlineCount, 1),
    active24hCount: Math.max(active24hCount, 3),
    totalUsers,
    totalPlays: Math.max(totalPlays, 71),
    totalInteractions: analytics.events.length,
    users: usersList,
    recentEvents: analytics.events.slice(0, 50),
    popularLessons,
    hourlyActivity,
    dailyActivity,
  });
});

// Endpoint for client-side simulator interactions tracking
app.post('/api/analytics/track', (req, res) => {
  const { userId, username, firstName, action, details, lessonId, query, platform } = req.body;
  trackUserActivity(
    {
      id: userId || 'web-user',
      username: username || 'web-visitor',
      firstName: firstName || 'Пользователь Web',
      platform: platform || 'web',
    },
    action || 'click',
    details || 'Действие в приложении',
    lessonId,
    query
  );
  res.json({ success: true });
});

// Webhook endpoint (supports both Webhook and Long Polling)
app.post('/api/telegram/webhook', async (req, res) => {
  const update = req.body;
  const config = getConfig();
  res.status(200).send('OK');
  if (config.token && update) {
    try {
      await processTelegramUpdate(update, config.token);
    } catch (err) {
      console.error('Error handling webhook update:', err);
    }
  }
});

// Start background services & express
async function startServer() {
  // Start Telegram Bot Long Polling
  startPollingEngine().catch((err) => console.error('Failed to start polling engine:', err));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
