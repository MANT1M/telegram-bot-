import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileAudio,
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileText,
  Clock,
  ArrowRight,
  Send,
} from 'lucide-react';
import { CatalogData } from '../types';
import { parseAdminCaption, generateFileId } from '../utils/telegramBotLogic';

interface AdminSimulatorProps {
  catalog: CatalogData;
  onLessonAdded: () => void;
  onGoToChat: () => void;
}

export const AdminSimulator: React.FC<AdminSimulatorProps> = ({
  catalog,
  onLessonAdded,
  onGoToChat,
}) => {
  // Config & Admin state
  const [trustedAdmins, setTrustedAdmins] = useState<string[]>([
    '@mant!m',
    'mant!m',
    '@mantim',
    'mantim',
    '789123456',
    '-1001234567890',
  ]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('@mant!m');
  const [customSenderId, setCustomSenderId] = useState<string>('');

  // Audio file fields
  const [fileName, setFileName] = useState('Aqeedah_03_Tawheed_Asma.mp3');
  const [durationSec, setDurationSec] = useState(380);
  const [fileId, setFileId] = useState(() => generateFileId());

  // Caption text
  const [caption, setCaption] = useState(
    `Тематика: Основы Ислама и Акыда\nГруппа: Таухид и столпы веры\nНазвание: Урок 3: Имена и Атрибуты Аллаха (Асма ва-с-Сыфат)\nОписание: Разбор третьей категории таухида, правила понимания прекрасных имен Создателя без искажения и уподобления.\nТаймкоды:\n00:00 — Введение в тему Сыфатов\n02:15 — Правила Ахлюс-Сунна\n05:40 — Практические плоды веры в Имена Аллаха`
  );

  // Status & Responses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    details?: string;
  } | null>(null);

  // Ingestion logs
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: number;
    senderId: string;
    status: 'success' | 'rejected_unauthorized' | 'parse_error';
    details: string;
    lessonTitle?: string;
  }>>([]);

  // Fetch initial config & logs
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.trustedAdminIds && data.trustedAdminIds.length > 0) {
          setTrustedAdmins(data.trustedAdminIds);
          setSelectedSenderId(data.trustedAdminIds[0]);
        }
      })
      .catch(() => {});

    fetchLogs();
  }, []);

  const fetchLogs = () => {
    fetch('/api/admin/logs')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLogs(data);
      })
      .catch(() => {});
  };

  const currentSender = selectedSenderId === 'custom' ? customSenderId.trim() : selectedSenderId;
  const isSenderAuthorized = trustedAdmins.includes(currentSender);

  // Live parsing
  const parsed = parseAdminCaption(caption);

  // Check if category or course exists
  const existingCategory = catalog.categories.find(
    (c) => c.title.toLowerCase().trim() === parsed.categoryTitle.toLowerCase().trim()
  );
  const existingCourse = existingCategory
    ? catalog.courses.find(
        (c) =>
          c.categoryId === existingCategory.id &&
          c.title.toLowerCase().trim() === parsed.courseTitle.toLowerCase().trim()
      )
    : null;

  // Preset templates
  const applyPreset = (presetType: 'existing' | 'new_course' | 'new_category' | 'invalid') => {
    if (presetType === 'existing') {
      setFileName('Aqeedah_03_Tawheed_Asma.mp3');
      setDurationSec(380);
      setFileId(generateFileId());
      setCaption(
        `Тематика: Основы Ислама и Акыда\nГруппа: Таухид и столпы веры\nНазвание: Урок 3: Имена и Атрибуты Аллаха\nОписание: Разбор третьей категории таухида: правила понимания прекрасных имен Создателя без искажения и уподобления.\nТаймкоды:\n00:00 — Введение\n02:10 — Правила Ахлюс-Сунна\n05:40 — Практические плоды веры`
      );
    } else if (presetType === 'new_course') {
      setFileName('Tajweed_02_Madd_Rules.mp3');
      setDurationSec(410);
      setFileId(generateFileId());
      setCaption(
        `Тематика: Изучение Корана и Таджвид\nГруппа: Таджвид с нуля: правильное чтение\nНазвание: Урок 2: Правила мадда (удлинения)\nОписание: Долгие гласные звуки, мадд таби'и (естественный) и вторичные виды мадда.\nТаймкоды:\n00:00 — Что такое мадд\n02:00 — Буквы мадда (Алиф, Вав, Йа)\n04:30 — Счет харакатов при чтении`
      );
    } else if (presetType === 'new_category') {
      setFileName('Hadith_Nawawi_01.mp3');
      setDurationSec(350);
      setFileId(generateFileId());
      setCaption(
        `Тематика: Хадисы и Сунна Пророка ﷺ\nГруппа: 40 хадисов имама ан-Навави\nНазвание: Урок 1: Хадис о намерении (Нийят)\nОписание: Разбор знаменитого хадиса «Поистине, дела оцениваются по намерениям».\nТаймкоды:\n00:00 — Текст и передатчики хадиса\n01:45 — Значение искренности (Ихлас)\n04:10 — Применение в повседневной жизни`
      );
    } else if (presetType === 'invalid') {
      setFileName('Random_Voice_Note.mp3');
      setDurationSec(120);
      setCaption(`Ассаляму алейкум! Записал аудиозаметку по уроку, послушайте.`);
    }
  };

  // Publish / Ingest Handler
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentSender,
          chatId: '-1001234567890',
          caption,
          fileId,
          fileName,
          duration: durationSec,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message,
          details: `Категория: «${data.category.title}» | Курс: «${data.course.title}» | ID: ${data.lesson.id}`,
        });
        onLessonAdded();
        fetchLogs();
        setFileId(generateFileId());
      } else {
        setFeedback({
          type: 'error',
          message: data.message || data.error || 'Ошибка обработки сообщения',
          details: data.missingFields ? `Не заполнены: ${data.missingFields.join(', ')}` : undefined,
        });
        fetchLogs();
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: 'Не удалось связаться с сервером бота.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Header & Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                🔒
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Интеграция с закрытой группой администраторов
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Бот непрерывно слушает новые сообщения с аудиофайлами от доверенных ID. При публикации он
              считывает структурированный шаблон подписи и автоматически регистрирует уроки.
            </p>
          </div>

          <button
            onClick={onGoToChat}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all cursor-pointer self-start sm:self-center"
          >
            <span>Проверить в чате бота</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Audio & Caption Publisher Form */}
        <div className="lg:col-span-2 space-y-5">
          <form onSubmit={handleIngest} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Имитация публикации аудиозаписи в канал</span>
              <span className="text-[11px] font-normal text-slate-400">Шаблон авторегистрации</span>
            </h3>

            {/* Admin identity selector */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Отправитель сообщения (user_id / chat_id):
                </label>
                {isSenderAuthorized ? (
                  <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Доверенный админ
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                    <ShieldAlert className="w-3 h-3 mr-1" /> Неавторизован (будет отклонен)
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedSenderId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                  className="bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                >
                  <option value="@mant!m">@mant!m (Главный администратор)</option>
                  <option value="mantim">mantim (Администратор)</option>
                  <option value="789123456">789123456 (Методист курса)</option>
                  <option value="-1001234567890">-1001234567890 (Закрытый канал авторов)</option>
                  <option value="custom">Указать произвольный ID (для теста доступа)...</option>
                </select>

                {selectedSenderId === 'custom' && (
                  <input
                    type="text"
                    value={customSenderId}
                    onChange={(e) => setCustomSenderId(e.target.value)}
                    placeholder="Например: 999111222"
                    className="flex-1 bg-slate-900 text-slate-200 text-xs px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                )}
              </div>
            </div>

            {/* Audio metadata (file_id, name, duration) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Название аудиофайла
                </label>
                <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-200">
                  <FileAudio className="w-4 h-4 text-sky-400 shrink-0" />
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="bg-transparent w-full focus:outline-none truncate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Длительность (сек)
                </label>
                <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-200">
                  <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                  <input
                    type="number"
                    min="10"
                    max="7200"
                    value={durationSec}
                    onChange={(e) => setDurationSec(Number(e.target.value))}
                    className="bg-transparent w-full focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({Math.floor(durationSec / 60)}:
                    {(durationSec % 60).toString().padStart(2, '0')})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Telegram file_id
                </label>
                <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono">
                  <span className="truncate flex-1 text-[11px] text-slate-400" title={fileId}>
                    {fileId}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFileId(generateFileId())}
                    className="text-slate-500 hover:text-sky-400 p-0.5"
                    title="Сгенерировать новый file_id"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Caption Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Подпись к аудио (Строго по шаблону):
                </label>
                <span className="text-[11px] text-slate-500">Автораспознавание полей</span>
              </div>

              {/* Quick preset buttons */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => applyPreset('existing')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  🕌 Акыда: Урок 3 (Таухид)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('new_course')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-sky-300 px-2 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  📖 Таджвид: Урок 2 (Мадд)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('new_category')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  📜 Новая тема: Хадисы
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('invalid')}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-300 px-2 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  ❌ Без шаблона (тест)
                </button>
              </div>

              <textarea
                rows={7}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Тематика: ...&#10;Группа: ...&#10;Название: ...&#10;Описание: ..."
                className="w-full bg-slate-950 text-slate-100 text-xs font-mono p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 leading-relaxed custom-scrollbar"
              />
            </div>

            {/* Feedback / Bot Response Notification */}
            {feedback && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed whitespace-pre-line ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                }`}
              >
                <div className="font-semibold mb-1 flex items-center space-x-1.5">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Ответ Telegram-бота в группе:</span>
                </div>
                <div className="pl-5">{feedback.message}</div>
                {feedback.details && (
                  <div className="mt-2 pl-5 text-[11px] opacity-80 border-t border-slate-700/40 pt-1.5 font-mono">
                    {feedback.details}
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Регистрация аудиофайла...' : 'Опубликовать аудиофайл в админ-группу'}
              </span>
            </button>
          </form>
        </div>

        {/* Right 1 col: Live Parser Inspection & Recent Logs */}
        <div className="space-y-5">
          {/* Live Parser Inspection Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Парсер шаблона</span>
              {parsed.isValid ? (
                <span className="text-emerald-400 text-[11px] lowercase flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> валиден
                </span>
              ) : (
                <span className="text-rose-400 text-[11px] lowercase flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" /> не полон
                </span>
              )}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Тематика (L1)</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-semibold text-slate-200">
                    {parsed.categoryTitle || '— не указана —'}
                  </span>
                  {parsed.categoryTitle && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        existingCategory
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      }`}
                    >
                      {existingCategory ? 'найдена' : '+ создастся'}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Группа / Курс (L2)</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-semibold text-slate-200">
                    {parsed.courseTitle || '— не указана —'}
                  </span>
                  {parsed.courseTitle && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        existingCourse
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                      }`}
                    >
                      {existingCourse ? 'найдена' : '+ создастся'}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Название урока (L3)</span>
                <span className="font-semibold text-slate-200 block mt-0.5 truncate">
                  {parsed.lessonTitle || '— не указано —'}
                </span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Описание и конспект</span>
                <span className="text-slate-300 block mt-0.5 line-clamp-3 text-[11px]">
                  {parsed.description || '— отсутствует —'}
                </span>
              </div>
            </div>
          </div>

          {/* Ingestion Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Журнал входящих аудио
              </h3>
              <button
                onClick={fetchLogs}
                className="text-slate-500 hover:text-slate-300 text-xs"
                title="Обновить журнал"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Событий пока нет. Опубликуйте аудио выше.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-[11px] p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                          log.status === 'success'
                            ? 'bg-emerald-950 text-emerald-400'
                            : log.status === 'rejected_unauthorized'
                            ? 'bg-rose-950 text-rose-400'
                            : 'bg-amber-950 text-amber-400'
                        }`}
                      >
                        {log.status === 'success'
                          ? '✅ Зарегистрирован'
                          : log.status === 'rejected_unauthorized'
                          ? '⛔ Отклонен (ID)'
                          : '⚠️ Ошибка шаблона'}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-tight">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
