import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Search,
  Bot,
  ChevronRight,
  Headphones,
  Check,
  Sparkles,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { CatalogData, TelegramMessage, InlineKeyboardButton } from '../types';
import { TelegramAudioPlayer } from './TelegramAudioPlayer';

interface TelegramSimulatorProps {
  catalog: CatalogData;
  onNavigateToAdmin?: () => void;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({ catalog, onNavigateToAdmin }) => {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeBreadcrumb, setActiveBreadcrumb] = useState<string>('Главное меню');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize bot on first load with /start
  useEffect(() => {
    if (messages.length === 0 && catalog.categories.length > 0) {
      triggerStartCommand();
    }
  }, [catalog.categories.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to build category keyboard (Level 1)
  const getCategoryKeyboard = (): InlineKeyboardButton[][] => {
    return catalog.categories.map((cat) => [
      {
        text: `${cat.icon || '📂'} ${cat.title}`,
        callback_data: `cat_${cat.id}`,
      },
    ]);
  };

  // Helper to build course keyboard (Level 2)
  const getCourseKeyboard = (categoryId: string): InlineKeyboardButton[][] => {
    const courses = catalog.courses.filter((c) => c.categoryId === categoryId);
    const rows: InlineKeyboardButton[][] = courses.map((course) => [
      {
        text: `📘 ${course.title}`,
        callback_data: `course_${course.id}`,
      },
    ]);
    rows.push([{ text: '⬅️ Назад к тематикам', callback_data: 'start' }]);
    return rows;
  };

  // Helper to build lessons keyboard (Level 3)
  const getLessonsKeyboard = (courseId: string): InlineKeyboardButton[][] => {
    const course = catalog.courses.find((c) => c.id === courseId);
    const lessons = catalog.lessons
      .filter((l) => l.courseId === courseId)
      .sort((a, b) => a.order - b.order);

    const rows: InlineKeyboardButton[][] = lessons.map((l) => [
      {
        text: `${l.order}. ${l.title}`,
        callback_data: `lesson_${l.id}`,
      },
    ]);

    rows.push([
      {
        text: '⬅️ Назад к курсам',
        callback_data: course ? `cat_${course.categoryId}` : 'start',
      },
    ]);
    return rows;
  };

  // Helper to build lesson control keyboard
  const getLessonControlKeyboard = (lessonId: string): InlineKeyboardButton[][] => {
    const lesson = catalog.lessons.find((l) => l.id === lessonId);
    if (!lesson) return [[{ text: '📋 К списку уроков', callback_data: 'start' }]];

    const courseLessons = catalog.lessons
      .filter((l) => l.courseId === lesson.courseId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = courseLessons.findIndex((l) => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? courseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < courseLessons.length - 1 ? courseLessons[currentIndex + 1] : null;

    const navRow: InlineKeyboardButton[] = [];
    if (prevLesson) {
      navRow.push({ text: '⏮ Предыдущий', callback_data: `lesson_${prevLesson.id}` });
    }
    if (nextLesson) {
      navRow.push({ text: 'Следующий ⏭', callback_data: `lesson_${nextLesson.id}` });
    }

    const rows: InlineKeyboardButton[][] = [];
    if (navRow.length > 0) {
      rows.push(navRow);
    }
    rows.push([{ text: '📋 К списку уроков', callback_data: `course_${lesson.courseId}` }]);
    rows.push([{ text: '🏠 В главное меню', callback_data: 'start' }]);

    return rows;
  };

  // Handler for /start command
  const triggerStartCommand = () => {
    setActiveBreadcrumb('Каталог > Тематики');
    const startMsg: TelegramMessage = {
      id: 'msg_' + Date.now(),
      sender: 'bot',
      text: `👋 Ассаляму алейкум! Приветствуем в боте обучающих аудиоуроков «Уроки по Исламу» (@Shukran_ufa_bot)!\n\nЗдесь вы найдете структурированные обучающие аудиоматериалы, распределенные по категориям и сериям уроков.\n\nВыберите интересующую тематику или введите ключевое слово для поиска:`,
      replyMarkup: {
        inline_keyboard: getCategoryKeyboard(),
      },
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, startMsg]);
  };

  // Handler for inline keyboard clicks
  const handleCallbackClick = (callbackData: string) => {
    const now = Date.now();

    // 1. Back to Start
    if (callbackData === 'start') {
      setActiveBreadcrumb('Каталог > Тематики');
      const response: TelegramMessage = {
        id: 'msg_' + now,
        sender: 'bot',
        text: `📚 Главное меню каталога аудиоуроков.\n\nВыберите тематику:`,
        replyMarkup: {
          inline_keyboard: getCategoryKeyboard(),
        },
        timestamp: now,
      };
      setMessages((prev) => [...prev, response]);
      return;
    }

    // 2. Select Category (Level 1 -> Level 2)
    if (callbackData.startsWith('cat_')) {
      const categoryId = callbackData.replace('cat_', '');
      const category = catalog.categories.find((c) => c.id === categoryId);
      const courses = catalog.courses.filter((c) => c.categoryId === categoryId);

      setActiveBreadcrumb(`Каталог > ${category?.title || 'Тема'}`);

      const response: TelegramMessage = {
        id: 'msg_' + now,
        sender: 'bot',
        text: `📂 Тематика: *${category?.title || 'Выбранная тема'}*\n\nДоступные группы уроков (курсы): ${courses.length}`,
        replyMarkup: {
          inline_keyboard: getCourseKeyboard(categoryId),
        },
        timestamp: now,
      };
      setMessages((prev) => [...prev, response]);
      return;
    }

    // 3. Select Course (Level 2 -> Level 3)
    if (callbackData.startsWith('course_')) {
      const courseId = callbackData.replace('course_', '');
      const course = catalog.courses.find((c) => c.id === courseId);
      const category = catalog.categories.find((c) => c.id === course?.categoryId);
      const lessons = catalog.lessons.filter((l) => l.courseId === courseId);

      setActiveBreadcrumb(`${category?.title || 'Тема'} > ${course?.title || 'Курс'}`);

      const response: TelegramMessage = {
        id: 'msg_' + now,
        sender: 'bot',
        text: `📘 Курс: *${course?.title || 'Группа уроков'}*\n${
          course?.description ? `_${course.description}_\n\n` : '\n'
        }Выберите аудиоурок для прослушивания (всего ${lessons.length} уроков):`,
        replyMarkup: {
          inline_keyboard: getLessonsKeyboard(courseId),
        },
        timestamp: now,
      };
      setMessages((prev) => [...prev, response]);
      return;
    }

    // 4. Select Lesson (Audio file card & controls)
    if (callbackData.startsWith('lesson_')) {
      const lessonId = callbackData.replace('lesson_', '');
      const lesson = catalog.lessons.find((l) => l.id === lessonId);
      if (!lesson) return;

      const course = catalog.courses.find((c) => c.id === lesson.courseId);
      const category = catalog.categories.find((c) => c.id === lesson.categoryId);

      setActiveBreadcrumb(`${course?.title || 'Курс'} > ${lesson.title}`);

      const response: TelegramMessage = {
        id: 'msg_' + now,
        sender: 'bot',
        isAudio: true,
        text: `🎵 *${lesson.title}*\n${course?.title ? `📚 Курс: ${course.title}\n` : ''}`,
        audio: {
          fileId: lesson.fileId,
          fileName: lesson.fileName,
          title: lesson.title,
          performer: course?.title || category?.title || 'AudioLessonsBot',
          duration: lesson.duration,
          audioUrl: lesson.audioUrl,
        },
        replyMarkup: {
          inline_keyboard: getLessonControlKeyboard(lessonId),
        },
        timestamp: now,
      };
      setMessages((prev) => [...prev, response]);
      return;
    }
  };

  // Handler for text input (Search or commands)
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    const now = Date.now();

    // User message bubble
    const userMsg: TelegramMessage = {
      id: 'user_' + now,
      sender: 'user',
      text: query,
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Check command
    if (query.toLowerCase() === '/start') {
      setTimeout(() => triggerStartCommand(), 200);
      return;
    }

    if (query.toLowerCase() === '/help') {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: `ℹ️ *Справка по боту аудиоуроков*\n\n• Отправьте /start для открытия главного каталога тематик.\n• Вводите любые ключевые слова для мгновенного поиска по урокам (например: «английский», «python», «бюджет»).\n• В каждом уроке доступны кнопки перехода к следующему/предыдущему уроку.`,
            replyMarkup: {
              inline_keyboard: [[{ text: '📚 Открыть каталог', callback_data: 'start' }]],
            },
            timestamp: Date.now(),
          },
        ]);
      }, 200);
      return;
    }

    // Perform Search
    setTimeout(() => {
      const q = query.toLowerCase();
      const matches = catalog.lessons.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          catalog.courses.find((c) => c.id === l.courseId)?.title.toLowerCase().includes(q) ||
          catalog.categories.find((c) => c.id === l.categoryId)?.title.toLowerCase().includes(q)
      );

      if (matches.length > 0) {
        const keyboard: InlineKeyboardButton[][] = matches.slice(0, 8).map((l) => [
          {
            text: `🎧 ${l.title}`,
            callback_data: `lesson_${l.id}`,
          },
        ]);
        keyboard.push([{ text: '🏠 В главное меню', callback_data: 'start' }]);

        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: `🔍 По запросу «${query}» найдено аудиоуроков: *${matches.length}*:\n\nВыберите урок для прослушивания:`,
            replyMarkup: {
              inline_keyboard: keyboard,
            },
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot_' + Date.now(),
            sender: 'bot',
            text: `🔍 По запросу «${query}» ничего не найдено.\n\nПопробуйте поискать по другим словам или выберите тему в каталоге:`,
            replyMarkup: {
              inline_keyboard: [[{ text: '📚 Открыть каталог тематик', callback_data: 'start' }]],
            },
            timestamp: Date.now(),
          },
        ]);
      }
    }, 250);
  };

  const handleQuickSearch = (keyword: string) => {
    setInputText(keyword);
    setTimeout(() => {
      const form = document.getElementById('chat-form') as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  };

  const handleResetChat = () => {
    setMessages([]);
    setTimeout(() => triggerStartCommand(), 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto bg-slate-950/90 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden my-4">
      {/* Telegram Chat Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-white text-sm">Уроки по Исламу</h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-semibold">
                bot
              </span>
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <span>@Shukran_ufa_bot</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 text-[11px] truncate max-w-xs">{activeBreadcrumb}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="hidden sm:inline-flex items-center text-xs text-sky-400 hover:text-sky-300 bg-sky-950/40 border border-sky-800/40 px-2.5 py-1.5 rounded-lg transition-colors"
              title="Перейти к отправке аудио из админ-группы"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Добавить аудио
            </button>
          )}

          <button
            onClick={handleResetChat}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Перезапустить диалог (/start)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/60 custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const lessonMatch = msg.audio
            ? catalog.lessons.find((l) => l.fileId === msg.audio?.fileId)
            : null;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-2xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              } w-full`}
            >
              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm shadow-sm transition-all ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tr-sm ml-12'
                    : 'bg-slate-900 border border-slate-800/90 text-slate-100 rounded-tl-sm mr-4 w-full'
                }`}
              >
                {/* Audio Component if message contains audio */}
                {msg.isAudio && msg.audio && (
                  <div className="mb-3">
                    <TelegramAudioPlayer
                      lessonId={lessonMatch?.id || 'temp'}
                      title={msg.audio.title}
                      courseTitle={msg.audio.performer}
                      duration={msg.audio.duration}
                      fileId={msg.audio.fileId}
                      fileName={msg.audio.fileName}
                      description={lessonMatch?.description}
                      audioUrl={msg.audio.audioUrl || lessonMatch?.audioUrl}
                    />
                  </div>
                )}

                {/* Text Content */}
                {msg.text && (
                  <div className="whitespace-pre-line leading-relaxed font-sans text-slate-200">
                    {msg.text}
                  </div>
                )}

                {/* Inline Keyboard Markup */}
                {msg.replyMarkup?.inline_keyboard && msg.replyMarkup.inline_keyboard.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-slate-800 space-y-1.5">
                    {msg.replyMarkup.inline_keyboard.map((row, rIdx) => (
                      <div
                        key={rIdx}
                        className={`grid gap-1.5 ${
                          row.length === 1
                            ? 'grid-cols-1'
                            : row.length === 2
                            ? 'grid-cols-2'
                            : 'grid-cols-3'
                        }`}
                      >
                        {row.map((btn, bIdx) => (
                          <button
                            key={bIdx}
                            type="button"
                            onClick={() => handleCallbackClick(btn.callback_data)}
                            className="w-full text-left sm:text-center text-xs font-semibold py-2 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 active:bg-sky-600 active:text-white border border-slate-700/80 hover:border-slate-600 text-sky-300 transition-all shadow-sm cursor-pointer truncate"
                            title={btn.text}
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp & Status */}
                <div
                  className={`mt-1.5 flex items-center justify-end text-[10px] ${
                    isUser ? 'text-sky-200' : 'text-slate-500'
                  } space-x-1`}
                >
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isUser && <Check className="w-3 h-3 stroke-[2.5]" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-500 text-[11px] font-medium shrink-0 flex items-center">
          <Search className="w-3 h-3 mr-1" /> Быстрый поиск:
        </span>
        <button
          onClick={triggerStartCommand}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
        >
          /start
        </button>
        <button
          onClick={() => {
            setInputText('/admin');
            setTimeout(() => {
              const form = document.getElementById('chat-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }, 50);
          }}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-800 transition-colors cursor-pointer font-medium"
        >
          👑 /admin
        </button>
        <button
          onClick={() => handleQuickSearch('Таухид')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors cursor-pointer"
        >
          🔍 Таухид
        </button>
        <button
          onClick={() => handleQuickSearch('Таджвид')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors cursor-pointer"
        >
          🔍 Таджвид
        </button>
        <button
          onClick={() => handleQuickSearch('Арабский')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors cursor-pointer"
        >
          🔍 Арабский
        </button>
        <button
          onClick={() => handleQuickSearch('Python')}
          className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
        >
          🔍 Python
        </button>
      </div>

      {/* Input bar */}
      <form
        id="chat-form"
        onSubmit={handleSendMessage}
        className="bg-slate-900 p-3 border-t border-slate-800 flex items-center space-x-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Напишите /start или ищите урок по названию/теме..."
          className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-sm px-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
          title="Отправить сообщение"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
