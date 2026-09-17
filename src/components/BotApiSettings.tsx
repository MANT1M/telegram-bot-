import React, { useState, useEffect } from 'react';
import {
  Key,
  Shield,
  Globe,
  Copy,
  Check,
  Code,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';

export const BotApiSettings: React.FC = () => {
  const [token, setToken] = useState('');
  const [trustedAdminIds, setTrustedAdminIds] = useState<string[]>([]);
  const [newAdminId, setNewAdminId] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<string | null>(null);
  const [isCheckingWebhook, setIsCheckingWebhook] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.token) setToken(data.token);
        if (data.trustedAdminIds) setTrustedAdminIds(data.trustedAdminIds);
      })
      .catch(() => {});
  }, []);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        trustedAdminIds,
      }),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleAddAdmin = () => {
    const trimmed = newAdminId.trim();
    if (trimmed && !trustedAdminIds.includes(trimmed)) {
      const updated = [...trustedAdminIds, trimmed];
      setTrustedAdminIds(updated);
      setNewAdminId('');
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trustedAdminIds: updated }),
      });
    }
  };

  const handleRemoveAdmin = (id: string) => {
    const updated = trustedAdminIds.filter((item) => item !== id);
    setTrustedAdminIds(updated);
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trustedAdminIds: updated }),
    });
  };

  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/telegram/webhook` : '';

  const handleSetTelegramWebhook = async () => {
    if (!token) {
      alert('Сначала введите TELEGRAM_BOT_TOKEN.');
      return;
    }
    setIsCheckingWebhook(true);
    setWebhookStatus(null);
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      const data = await response.json();
      if (data.ok) {
        setWebhookStatus(`✅ Webhook успешно установлен в Telegram! (${data.description})`);
      } else {
        setWebhookStatus(`❌ Telegram API вернул ошибку: ${data.description}`);
      }
    } catch (err: unknown) {
      setWebhookStatus('❌ Не удалось выполнить запрос к api.telegram.org. Проверьте соединение.');
    } finally {
      setIsCheckingWebhook(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard?.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const standaloneScriptCode = `// Standalone Telegram Bot for Audio Lessons Catalog
// Run with: node bot.mjs (requires Node.js 18+)
import fs from 'fs';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || "${token || 'YOUR_BOT_TOKEN'}";
const TRUSTED_ADMINS = ${JSON.stringify(trustedAdminIds)};

// Full structured caption parser template:
// Тематика: [Название темы]
// Группа: [Название курса/группы]
// Название: [Тема урока / Номер]
// Описание: [Краткий конспект или таймкоды]

console.log("🚀 Telegram Audio Lessons Bot started!");
`;

  const copyScript = () => {
    navigator.clipboard?.writeText(standaloneScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-sky-400" />
          <span>Настройки Telegram Bot API и Безопасности</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Здесь можно подключить реального бота из @BotFather и управлять белым списком ID администраторов.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Token and Webhook */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Key className="w-4 h-4 text-sky-400" />
            <span>Токен бота (BotFather)</span>
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                TELEGRAM_BOT_TOKEN
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full bg-slate-950 text-slate-200 text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-sky-500/20"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Сохранить токен</span>
                </>
              )}
            </button>
          </form>

          {/* Webhook setup */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                URL Webhook для Telegram
              </span>
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                {copiedWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedWebhook ? 'Скопировано' : 'Копировать'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 break-all">
              {webhookUrl}
            </div>

            <button
              type="button"
              disabled={isCheckingWebhook || !token}
              onClick={handleSetTelegramWebhook}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              {isCheckingWebhook ? 'Отправка в Telegram...' : 'Зарегистрировать Webhook в Telegram'}
            </button>

            {webhookStatus && (
              <p className="text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 leading-relaxed font-mono">
                {webhookStatus}
              </p>
            )}
          </div>
        </div>

        {/* Trusted Admin IDs whitelist */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Доверенные ID (user_id / chat_id)</span>
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {trustedAdminIds.length} ID
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Бот принимает новые аудиоуроки только от пользователей или групп с этими идентификаторами:
          </p>

          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {trustedAdminIds.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
              >
                <span>{id}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAdmin(id)}
                  className="text-slate-500 hover:text-rose-400 text-xs ml-2 cursor-pointer"
                  title="Удалить из белого списка"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              placeholder="Новый user_id или chat_id..."
              className="flex-1 bg-slate-950 text-slate-200 text-xs font-mono px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={handleAddAdmin}
              disabled={!newAdminId.trim()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              + Добавить
            </button>
          </div>
        </div>
      </div>

      {/* Caption Format Reference */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Спецификация шаблона подписи для администраторов</span>
        </h3>
        <p className="text-xs text-slate-400">
          При пересылке аудиозаписи в группу администраторов подпись должна содержать 4 обязательных блока:
        </p>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono text-sky-300 leading-relaxed space-y-1">
          <div><span className="text-slate-500">Тематика:</span> [Название темы (Уровень 1)]</div>
          <div><span className="text-slate-500">Группа:</span> [Название курса/группы (Уровень 2)]</div>
          <div><span className="text-slate-500">Название:</span> [Тема урока / Номер (Уровень 3)]</div>
          <div><span className="text-slate-500">Описание:</span> [Краткий конспект или таймкоды]</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block mb-1">Мгновенный file_id</strong>
            Бот сохраняет Telegram file_id без повторной загрузки файла на сторонний сервер.
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block mb-1">Автосоздание категорий</strong>
            Если тема или группа не найдены в каталоге, бот создаст их автоматически.
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <strong className="text-slate-200 block mb-1">Удобная навигация</strong>
            Пользователь всегда имеет под рукой кнопки «⏮ Предыдущий», «Следующий ⏭», «📋 К списку уроков».
          </div>
        </div>
      </div>
    </div>
  );
};
