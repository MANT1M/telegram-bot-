import React, { useState, useEffect, useCallback } from 'react';
import { CatalogData } from './types';
import { initialCatalogData } from './data/seedData';
import { Header } from './components/Header';
import { TelegramSimulator } from './components/TelegramSimulator';
import { AdminPanel } from './components/AdminPanel';
import { CatalogBrowser } from './components/CatalogBrowser';
import { BotApiSettings } from './components/BotApiSettings';

export default function App() {
  const [catalog, setCatalog] = useState<CatalogData>(initialCatalogData);
  const [activeTab, setActiveTab] = useState<'chat' | 'admin' | 'catalog' | 'settings'>('chat');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.courses && data.lessons) {
          setCatalog(data);
        }
      }
    } catch {
      // Keep initialCatalogData
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleLessonAdded = () => {
    fetchCatalog();
  };

  const handleSelectLessonInBot = (lessonId: string) => {
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top App Bar with Bot Status & Tab Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lessonsCount={catalog.lessons.length}
        coursesCount={catalog.courses.length}
        categoriesCount={catalog.categories.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {activeTab === 'chat' && (
          <TelegramSimulator
            catalog={catalog}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            catalog={catalog}
            onRefreshCatalog={fetchCatalog}
            onGoToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'catalog' && (
          <CatalogBrowser
            catalog={catalog}
            onRefresh={fetchCatalog}
            onSelectLessonInBot={handleSelectLessonInBot}
          />
        )}

        {activeTab === 'settings' && <BotApiSettings />}
      </main>

      {/* Subdued Footer */}
      <footer className="border-t border-slate-900 py-3 text-center text-xs text-slate-500">
        <p>
          Telegram Audio Lessons Bot • 3-уровневый каталог • Авторегистрация file_id из закрытого канала
        </p>
      </footer>
    </div>
  );
}
