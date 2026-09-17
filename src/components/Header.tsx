import React, { useState, useEffect } from 'react';
import { Send, ShieldCheck, Database, Sliders, CheckCircle2, ExternalLink } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'admin' | 'catalog' | 'settings';
  setActiveTab: (tab: 'chat' | 'admin' | 'catalog' | 'settings') => void;
  lessonsCount: number;
  coursesCount: number;
  categoriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lessonsCount,
  coursesCount,
  categoriesCount,
}) => {
  const [botUsername, setBotUsername] = useState('Shukran_ufa_bot');
  const [botTitle, setBotTitle] = useState('Уроки по Исламу');

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.botUsername) setBotUsername(data.botUsername);
        if (data.botTitle) setBotTitle(data.botTitle);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 gap-4">
          {/* Logo & Bot Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Send className="w-5 h-5 text-sky-400 -translate-x-0.5 translate-y-0.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {botTitle}
                </h1>
                <a
                  href={`https://t.me/${botUsername}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/60 transition-colors"
                  title="Открыть бота в Telegram"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                  @{botUsername}
                  <ExternalLink className="w-2.5 h-2.5 ml-1 text-emerald-400 opacity-70" />
                </a>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-sky-400 font-medium">Админ: @mant!m</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300">
                  {categoriesCount} тем / {coursesCount} курсов / {lessonsCount} аудио
                </span>
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
            <button
              id="tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Чат с ботом</span>
            </button>

            <button
              id="tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Панель администратора</span>
            </button>

            <button
              id="tab-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Каталог уроков</span>
            </button>

            <button
              id="tab-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Telegram API</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
