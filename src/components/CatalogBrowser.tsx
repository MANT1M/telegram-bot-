import React, { useState } from 'react';
import {
  Folder,
  BookOpen,
  Headphones,
  Search,
  Clock,
  Play,
  Pause,
  Download,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { CatalogData, AudioLesson } from '../types';
import { formatDuration } from '../utils/telegramBotLogic';
import { audioPlayer } from '../utils/audioSynth';

interface CatalogBrowserProps {
  catalog: CatalogData;
  onRefresh: () => void;
  onSelectLessonInBot: (lessonId: string) => void;
}

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  catalog,
  onRefresh,
  onSelectLessonInBot,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'cat-languages': true,
    'cat-programming': true,
    'cat-business': true,
  });
  const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handlePlayToggle = (lesson: AudioLesson) => {
    if (playingLessonId === lesson.id) {
      audioPlayer.pause();
      setPlayingLessonId(null);
    } else {
      audioPlayer.play(lesson.id, lesson.duration);
      setPlayingLessonId(lesson.id);
    }
  };

  const handleResetCatalog = async () => {
    if (confirm('Сбросить весь каталог к базовым демонстрационным аудиоурокам?')) {
      await fetch('/api/catalog/reset', { method: 'POST' });
      onRefresh();
    }
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(catalog, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `telegram_audio_catalog_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter lessons
  const filterLower = searchFilter.toLowerCase().trim();
  const filteredLessons = filterLower
    ? catalog.lessons.filter(
        (l) =>
          l.title.toLowerCase().includes(filterLower) ||
          l.description.toLowerCase().includes(filterLower)
      )
    : catalog.lessons;

  const totalDuration = catalog.lessons.reduce((acc, l) => acc + (l.duration || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Иерархия каталога аудиоуроков</span>
            <span className="text-xs font-normal text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
              3 уровня
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Уровень 1 (Тематика) → Уровень 2 (Группа уроков/Курс) → Уровень 3 (Аудиоуроки с file_id)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-white">{catalog.categories.length}</span> тем
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-white">{catalog.courses.length}</span> курсов
            <span className="text-slate-600">•</span>
            <span className="font-semibold text-white">{catalog.lessons.length}</span> аудио
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">{formatDuration(totalDuration)}</span>
          </div>

          <button
            onClick={exportJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Экспортировать JSON файл"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт JSON</span>
          </button>

          <button
            onClick={handleResetCatalog}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Сбросить к исходным"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить</span>
          </button>
        </div>
      </div>

      {/* Search bar inside catalog */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Фильтр уроков по названию или тексту описания..."
          className="w-full bg-slate-900 text-slate-100 text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
        />
        {searchFilter && (
          <button
            onClick={() => setSearchFilter('')}
            className="absolute right-3.5 top-2.5 text-xs text-slate-500 hover:text-white"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Catalog Tree */}
      <div className="space-y-4">
        {catalog.categories.map((category) => {
          const courses = catalog.courses.filter((c) => c.categoryId === category.id);
          const categoryLessons = catalog.lessons.filter((l) => l.categoryId === category.id);
          const isExpanded = expandedCategories[category.id] !== false;

          // If searching, only show if any course/lesson matches
          const hasMatchingLessons = categoryLessons.some((l) =>
            filteredLessons.some((fl) => fl.id === l.id)
          );
          if (filterLower && !hasMatchingLessons) return null;

          return (
            <div
              key={category.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md"
            >
              {/* Level 1 Header: Category */}
              <div
                onClick={() => toggleCategory(category.id)}
                className="px-5 py-3.5 bg-slate-800/60 hover:bg-slate-800/90 border-b border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{category.icon || '📂'}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/60">
                        Уровень 1: Тематика
                      </span>
                      <h3 className="text-sm font-bold text-white">{category.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {courses.length} курсов • {categoryLessons.length} аудиозаписей
                    </p>
                  </div>
                </div>

                <div className="text-slate-400">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </div>

              {/* Level 2 & 3: Courses and Lessons */}
              {isExpanded && (
                <div className="p-5 space-y-5 divide-y divide-slate-800/60">
                  {courses.map((course) => {
                    const courseLessons = catalog.lessons
                      .filter((l) => l.courseId === course.id)
                      .sort((a, b) => a.order - b.order);

                    const matchingCourseLessons = courseLessons.filter((l) =>
                      filteredLessons.some((fl) => fl.id === l.id)
                    );
                    if (filterLower && matchingCourseLessons.length === 0) return null;

                    return (
                      <div key={course.id} className="pt-4 first:pt-0 space-y-3">
                        {/* Level 2: Course Card */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2.5">
                            <BookOpen className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                  Уровень 2: Курс
                                </span>
                                <h4 className="text-sm font-semibold text-slate-100">
                                  {course.title}
                                </h4>
                              </div>
                              {course.description && (
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                  {course.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                            {courseLessons.length} уроков
                          </span>
                        </div>

                        {/* Level 3: Lessons List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-6">
                          {courseLessons.map((lesson) => {
                            if (filterLower && !filteredLessons.some((fl) => fl.id === lesson.id)) {
                              return null;
                            }

                            const isPlaying = playingLessonId === lesson.id;

                            return (
                              <div
                                key={lesson.id}
                                className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                                  isPlaying
                                    ? 'bg-sky-950/40 border-sky-500/60 ring-1 ring-sky-500/40'
                                    : 'bg-slate-950 border-slate-800/90 hover:border-slate-700'
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="font-semibold text-slate-200 leading-snug">
                                      {lesson.title}
                                    </h5>
                                    <span className="text-[10px] font-mono text-slate-400 flex items-center shrink-0">
                                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                                      {formatDuration(lesson.duration)}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                    {lesson.description}
                                  </p>
                                </div>

                                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                  <span
                                    className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]"
                                    title={lesson.fileId}
                                  >
                                    {lesson.fileId}
                                  </span>

                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handlePlayToggle(lesson)}
                                      className={`p-1.5 rounded-lg text-[11px] flex items-center space-x-1 transition-colors cursor-pointer ${
                                        isPlaying
                                          ? 'bg-sky-500 text-white'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                      }`}
                                      title={isPlaying ? 'Пауза' : 'Прослушать'}
                                    >
                                      {isPlaying ? (
                                        <Pause className="w-3 h-3 fill-current" />
                                      ) : (
                                        <Play className="w-3 h-3 fill-current translate-x-0.5" />
                                      )}
                                      <span>{isPlaying ? 'Пауза' : 'Слушать'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => onSelectLessonInBot(lesson.id)}
                                      className="p-1.5 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 border border-sky-800/60 text-[11px] flex items-center space-x-1 transition-colors cursor-pointer"
                                      title="Открыть в Telegram боте"
                                    >
                                      <Headphones className="w-3 h-3" />
                                      <span>В бот</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
