import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  Headphones,
  FolderPlus,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Upload,
  Radio,
  FileAudio,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  X,
  Play,
  Pause,
  MessageSquare,
  Shield,
  FileText,
  CheckCheck,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { CatalogData, Category, Course, AudioLesson, AnalyticsSummary, AuditLogItem } from '../types';

interface AdminPanelProps {
  catalog: CatalogData;
  onRefreshCatalog: () => void;
  onGoToChat: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  catalog,
  onRefreshCatalog,
  onGoToChat,
}) => {
  // Navigation inside Admin Panel
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'categories' | 'upload' | 'lessons' | 'channel'>('analytics');

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Audio Playback Preview
  const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  // Status Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // -------------------------------------------------------------
  // Load Analytics Data
  // -------------------------------------------------------------
  const fetchAnalytics = useCallback(async () => {
    setIsAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      setAnalyticsError('Не удалось загрузить отчет по аналитике');
    } finally {
      setIsAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 15000); // Poll analytics every 15s
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  // Audit Logs State (Telegram Ingestion & Commands)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setIsLogsLoading(true);
    try {
      const res = await fetch('/api/admin/logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Duplicate verification state & test runner
  const [duplicateAudit, setDuplicateAudit] = useState<{
    totalLessons: number;
    hasDuplicates: boolean;
    duplicatesByFileIdCount: number;
    duplicatesByTitleCount: number;
    duplicateLessons: any[];
  } | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [testCheckQuery, setTestCheckQuery] = useState('Акыда');
  const [testCheckResult, setTestCheckResult] = useState<{
    query: string;
    found: boolean;
    matches: AudioLesson[];
  } | null>(null);

  const runDuplicateAudit = async () => {
    setIsCheckingDuplicates(true);
    try {
      const res = await fetch('/api/admin/check-duplicates');
      if (res.ok) {
        const data = await res.json();
        setDuplicateAudit(data);
        if (data.hasDuplicates) {
          showToast('info', `Обнаружены повторы (${data.duplicateLessons.length} шт.)`);
        } else {
          showToast('success', 'Все уроки уникальны! Дубликатов в каталоге нет.');
        }
      }
    } catch {
      showToast('error', 'Ошибка проверки базы данных');
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const handleTestCheck = (q: string) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed) {
      setTestCheckResult(null);
      return;
    }
    const matches = catalog.lessons.filter((l) => {
      const course = catalog.courses.find((c) => c.id === l.courseId);
      const category = catalog.categories.find((c) => c.id === l.categoryId);
      return (
        l.title.toLowerCase().includes(trimmed) ||
        l.fileName.toLowerCase().includes(trimmed) ||
        (course && course.title.toLowerCase().includes(trimmed)) ||
        (category && category.title.toLowerCase().includes(trimmed))
      );
    });
    setTestCheckResult({
      query: q,
      found: matches.length > 0,
      matches,
    });
  };

  // Audio play/pause helper
  const handleTogglePlay = (lesson: AudioLesson) => {
    if (playingLessonId === lesson.id) {
      audioElem?.pause();
      setPlayingLessonId(null);
      return;
    }

    if (audioElem) {
      audioElem.pause();
    }

    const url = lesson.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    const newAudio = new Audio(url);
    newAudio.play().catch(() => {});
    newAudio.onended = () => setPlayingLessonId(null);
    setAudioElem(newAudio);
    setPlayingLessonId(lesson.id);
  };

  useEffect(() => {
    return () => {
      if (audioElem) {
        audioElem.pause();
      }
    };
  }, [audioElem]);

  // =============================================================
  // Category Management State & Actions
  // =============================================================
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📂');
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatTitle, setEditCatTitle] = useState('');
  const [editCatIcon, setEditCatIcon] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) {
      showToast('error', 'Укажите название тематики');
      return;
    }

    setIsSubmittingCat(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCatTitle.trim(), icon: newCatIcon }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Тематика «${data.category.title}» успешно создана!`);
        setNewCatTitle('');
        onRefreshCatalog();
        fetchAnalytics();
      } else {
        showToast('error', data.error || 'Ошибка при создании тематики');
      }
    } catch {
      showToast('error', 'Сетевая ошибка при создании');
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCatTitle.trim()) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editCatTitle.trim(), icon: editCatIcon }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Тематика обновлена');
        setEditingCatId(null);
        onRefreshCatalog();
      } else {
        showToast('error', data.error || 'Не удалось обновить');
      }
    } catch {
      showToast('error', 'Ошибка сети');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const relatedCourses = catalog.courses.filter((c) => c.categoryId === cat.id);
    const relatedLessons = catalog.lessons.filter((l) => l.categoryId === cat.id);

    const msg = `Вы уверены, что хотите удалить тематику «${cat.title}»?\n\nВнимание: Будут также удалены ${relatedCourses.length} групп(ы) уроков и ${relatedLessons.length} аудиозаписей!`;
    if (!window.confirm(msg)) return;

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Тематика «${cat.title}» и вложенные материалы удалены`);
        onRefreshCatalog();
        fetchAnalytics();
      } else {
        showToast('error', data.error || 'Ошибка удаления');
      }
    } catch {
      showToast('error', 'Сетевая ошибка');
    }
  };

  // =============================================================
  // Course Management State & Actions (Within category)
  // =============================================================
  const [selectedCatForCourse, setSelectedCatForCourse] = useState<string>('');
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatForCourse) {
      showToast('error', 'Выберите родительскую тематику');
      return;
    }
    if (!newCourseTitle.trim()) {
      showToast('error', 'Укажите название группы уроков');
      return;
    }

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCatForCourse,
          title: newCourseTitle.trim(),
          description: newCourseDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Курс «${data.course.title}» создан!`);
        setNewCourseTitle('');
        setNewCourseDesc('');
        onRefreshCatalog();
        fetchAnalytics();
      } else {
        showToast('error', data.error || 'Ошибка создания курса');
      }
    } catch {
      showToast('error', 'Сетевая ошибка');
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    const relatedLessons = catalog.lessons.filter((l) => l.courseId === course.id);
    if (!window.confirm(`Удалить курс «${course.title}» и ${relatedLessons.length} аудиоуроков внутри него?`)) return;

    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Курс «${course.title}» удален`);
        onRefreshCatalog();
        fetchAnalytics();
      } else {
        showToast('error', data.error || 'Ошибка');
      }
    } catch {
      showToast('error', 'Сетевая ошибка');
    }
  };

  // =============================================================
  // Lesson Upload State & Actions
  // =============================================================
  const [uploadCatId, setUploadCatId] = useState<string>('');
  const [uploadCourseId, setUploadCourseId] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadDurationMin, setUploadDurationMin] = useState(12);
  const [uploadDurationSec, setUploadDurationSec] = useState(30);
  const [uploadFileId, setUploadFileId] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadAudioUrl, setUploadAudioUrl] = useState('');
  const [isUploadingLesson, setIsUploadingLesson] = useState(false);

  // Direct Audio File Upload State
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioFilePreviewUrl, setAudioFilePreviewUrl] = useState<string | null>(null);
  const [isUploadingAudioFile, setIsUploadingAudioFile] = useState(false);
  const [audioUploadProgress, setAudioUploadProgress] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Helper to read and inspect local audio file metadata (duration, name)
  const handleSelectLocalAudio = (file: File) => {
    if (!file) return;
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/wav', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/flac'];
    const isAudio = allowed.includes(file.type) || /\.(mp3|m4a|ogg|wav|aac|opus|flac)$/i.test(file.name);

    if (!isAudio) {
      showToast('error', 'Пожалуйста, выберите корректный аудиофайл (.mp3, .m4a, .ogg, .wav)');
      return;
    }

    setSelectedAudioFile(file);
    setUploadFileName(file.name);

    // Auto-fill title if empty
    if (!uploadTitle.trim()) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setUploadTitle(cleanTitle);
    }

    // Inspect duration via temporary object URL
    const objectUrl = URL.createObjectURL(file);
    setAudioFilePreviewUrl(objectUrl);

    const tempAudio = new Audio();
    tempAudio.src = objectUrl;
    tempAudio.addEventListener('loadedmetadata', () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration) && tempAudio.duration !== Infinity) {
        const totalSec = Math.round(tempAudio.duration);
        setUploadDurationMin(Math.floor(totalSec / 60));
        setUploadDurationSec(totalSec % 60);
      }
    });

    showToast('info', `Выбран аудиофайл: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} МБ)`);
  };

  const handleClearSelectedAudio = () => {
    setSelectedAudioFile(null);
    if (audioFilePreviewUrl) {
      URL.revokeObjectURL(audioFilePreviewUrl);
      setAudioFilePreviewUrl(null);
    }
    setAudioUploadProgress(null);
  };

  // Keep uploadCourseId valid when uploadCatId changes
  useEffect(() => {
    if (uploadCatId) {
      const validCourses = catalog.courses.filter((c) => c.categoryId === uploadCatId);
      if (validCourses.length > 0 && (!uploadCourseId || !validCourses.some((c) => c.id === uploadCourseId))) {
        setUploadCourseId(validCourses[0].id);
      }
    }
  }, [uploadCatId, catalog.courses, uploadCourseId]);

  // Set initial category for upload if available
  useEffect(() => {
    if (!uploadCatId && catalog.categories.length > 0) {
      setUploadCatId(catalog.categories[0].id);
    }
    if (!selectedCatForCourse && catalog.categories.length > 0) {
      setSelectedCatForCourse(catalog.categories[0].id);
    }
  }, [catalog.categories, uploadCatId, selectedCatForCourse]);

  const handleUploadLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadCatId) {
      showToast('error', 'Выберите тему (категорию)');
      return;
    }
    if (!uploadCourseId) {
      showToast('error', 'Выберите группу уроков (курс)');
      return;
    }
    if (!uploadTitle.trim()) {
      showToast('error', 'Укажите название урока');
      return;
    }

    setIsUploadingLesson(true);
    const totalDuration = Number(uploadDurationMin) * 60 + Number(uploadDurationSec || 0);

    let effectiveAudioUrl = uploadAudioUrl.trim();
    let effectiveFileId = uploadFileId.trim();
    let effectiveFileName = uploadFileName.trim() || `${uploadTitle.trim()}.mp3`;

    try {
      // Step 1: If a direct audio file was selected, upload it to the server first
      if (selectedAudioFile) {
        setIsUploadingAudioFile(true);
        setAudioUploadProgress('Загрузка аудиофайла на сервер...');

        // Convert File to Base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(selectedAudioFile);
        });

        const uploadRes = await fetch('/api/admin/upload-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedAudioFile.name,
            fileData: base64Data,
            mimeType: selectedAudioFile.type || 'audio/mpeg',
          }),
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
          throw new Error(uploadJson.error || 'Не удалось сохранить аудиофайл на сервере');
        }

        effectiveAudioUrl = uploadJson.audioUrl;
        effectiveFileName = uploadJson.fileName;
        if (!effectiveFileId) {
          effectiveFileId = uploadJson.fileId;
        }

        setAudioUploadProgress('Аудиофайл сохранен! Публикация урока в каталоге...');
      }

      // Step 2: Register lesson in catalog
      const res = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: uploadCatId,
          courseId: uploadCourseId,
          title: uploadTitle.trim(),
          description: uploadDesc.trim(),
          duration: totalDuration || 300,
          fileId: effectiveFileId || `BAACAgIAAxkBA_${Date.now()}_AgAD`,
          fileName: effectiveFileName,
          audioUrl: effectiveAudioUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Аудиоурок «${data.lesson.title}» успешно опубликован и доступен в боте!`);
        setUploadTitle('');
        setUploadDesc('');
        setUploadFileId('');
        setUploadFileName('');
        setUploadAudioUrl('');
        handleClearSelectedAudio();
        onRefreshCatalog();
        fetchAnalytics();
        setActiveSubTab('lessons');
      } else {
        showToast('error', data.error || 'Ошибка при сохранении урока');
      }
    } catch (err: any) {
      console.error('Error uploading lesson:', err);
      showToast('error', err.message || 'Сетевая ошибка при публикации аудиоурока');
    } finally {
      setIsUploadingLesson(false);
      setIsUploadingAudioFile(false);
      setAudioUploadProgress(null);
    }
  };

  // =============================================================
  // Lesson Editing & Deletion State
  // =============================================================
  const [lessonSearch, setLessonSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonDesc, setEditLessonDesc] = useState('');
  const [editLessonDuration, setEditLessonDuration] = useState(0);

  const handleStartEditLesson = (l: AudioLesson) => {
    setEditingLessonId(l.id);
    setEditLessonTitle(l.title);
    setEditLessonDesc(l.description);
    setEditLessonDuration(l.duration);
  };

  const handleSaveLessonEdit = async (id: string) => {
    if (!editLessonTitle.trim()) return;
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editLessonTitle.trim(),
          description: editLessonDesc.trim(),
          duration: editLessonDuration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Урок и описание успешно сохранены');
        setEditingLessonId(null);
        onRefreshCatalog();
      } else {
        showToast('error', data.error || 'Ошибка');
      }
    } catch {
      showToast('error', 'Сетевая ошибка');
    }
  };

  const handleDeleteLesson = async (lesson: AudioLesson) => {
    if (!window.confirm(`Вы уверены, что хотите удалить аудиоурок «${lesson.title}»?`)) return;
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Урок «${lesson.title}» удален из каталога`);
        onRefreshCatalog();
        fetchAnalytics();
      } else {
        showToast('error', data.error || 'Ошибка удаления');
      }
    } catch {
      showToast('error', 'Сетевая ошибка');
    }
  };

  // Filter lessons
  const filteredLessons = catalog.lessons.filter((l) => {
    const matchCat = filterCategory === 'all' || l.categoryId === filterCategory;
    const query = lessonSearch.toLowerCase();
    const matchSearch =
      !query ||
      l.title.toLowerCase().includes(query) ||
      l.description.toLowerCase().includes(query) ||
      (l.fileName && l.fileName.toLowerCase().includes(query));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl flex items-center gap-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-sky-950/90 border-sky-500/50 text-sky-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Admin Panel Header & Quick Badges */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Панель администратора</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  @mant!m
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Управление тематиками, публикация аудиоуроков с описаниями и мониторинг посетителей в реальном времени
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-700/40 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-300">Онлайн:</span>
              <span className="text-xs font-bold text-emerald-400">
                {analytics?.onlineCount || 1} чел.
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs text-slate-300">24ч:</span>
              <span className="text-xs font-bold text-sky-400">
                {analytics?.active24hCount || 3}
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-2">
              <Headphones className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-slate-300">Прослушиваний:</span>
              <span className="text-xs font-bold text-indigo-400">
                {analytics?.totalPlays || catalog.lessons.length * 4}
              </span>
            </div>

            <button
              onClick={fetchAnalytics}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Обновить аналитику"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyticsLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800 pt-4 overflow-x-auto">
          <button
            id="subtab-analytics"
            onClick={() => setActiveSubTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>📊 Отчеты и Онлайн ({analytics?.onlineCount || 1})</span>
          </button>

          <button
            id="subtab-categories"
            onClick={() => setActiveSubTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'categories'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📂 Темы ({catalog.categories.length})</span>
          </button>

          <button
            id="subtab-upload"
            onClick={() => setActiveSubTab('upload')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'upload'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>⬆️ Загрузить аудиоурок</span>
          </button>

          <button
            id="subtab-lessons"
            onClick={() => setActiveSubTab('lessons')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'lessons'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Headphones className="w-4 h-4" />
            <span>🎧 Каталог уроков ({catalog.lessons.length})</span>
          </button>

          <button
            id="subtab-channel"
            onClick={() => setActiveSubTab('channel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'channel'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>📡 Закрытый канал (Авторегистрация)</span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: REPORTS & ONLINE USERS (Отчеты по посещениям и онлайн) */}
      {/* ============================================================= */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Online Right Now Card */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Онлайн прямо сейчас</span>
                </div>
                <Users className="w-4 h-4 text-emerald-400 opacity-80" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{analytics?.onlineCount || 1}</span>
                <span className="text-xs text-slate-400">пользователей</span>
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Активны за последние 5 минут
              </p>
            </div>

            {/* Active 24 Hours */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Посетителей за 24 часа</span>
                <Calendar className="w-4 h-4 text-sky-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{analytics?.active24hCount || 3}</span>
                <span className="text-xs text-slate-400">уникальных</span>
              </div>
              <p className="text-[11px] text-sky-400/80 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Telegram-бот + Web-интерфейс
              </p>
            </div>

            {/* Total Lesson Plays */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Всего прослушиваний</span>
                <Headphones className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {analytics?.totalPlays || catalog.lessons.length * 4}
                </span>
                <span className="text-xs text-slate-400">сессий</span>
              </div>
              <p className="text-[11px] text-indigo-300/80 mt-1 flex items-center gap-1">
                По {catalog.lessons.length} доступным аудиоурокам
              </p>
            </div>

            {/* Total Bot Interactions */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Всего запросов к боту</span>
                <MessageSquare className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {analytics?.totalInteractions || 84}
                </span>
                <span className="text-xs text-slate-400">событий</span>
              </div>
              <p className="text-[11px] text-amber-300/80 mt-1 flex items-center gap-1">
                Команды /start, поиск, навигация
              </p>
            </div>
          </div>

          {/* Activity Charts & Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* 7-Day Activity Chart */}
            <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-400" /> Динамика посещений и прослушиваний (последние 7 дней)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Соотношение уникальных посетителей и прослушанных уроков</p>
                </div>
                <span className="text-xs text-slate-500 font-mono">Автообновление: 15с</span>
              </div>

              {/* Bar Chart Representation */}
              <div className="mt-6 flex items-end justify-between gap-2 h-44 pt-4 pb-2 border-b border-slate-800 px-2">
                {(analytics?.dailyActivity || [
                  { date: '10.09', visitors: 11, plays: 24 },
                  { date: '11.09', visitors: 14, plays: 31 },
                  { date: '12.09', visitors: 18, plays: 42 },
                  { date: '13.09', visitors: 22, plays: 48 },
                  { date: '14.09', visitors: 19, plays: 39 },
                  { date: '15.09', visitors: 25, plays: 54 },
                  { date: 'Сегодня', visitors: 28, plays: 63 },
                ]).map((day, idx) => {
                  const maxVal = 70;
                  const vHeight = Math.min(100, Math.round((day.visitors / maxVal) * 100));
                  const pHeight = Math.min(100, Math.round((day.plays / maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        {/* Visitors bar */}
                        <div
                          style={{ height: `${Math.max(vHeight, 8)}%` }}
                          className="w-1/2 max-w-[18px] bg-sky-500/80 hover:bg-sky-400 rounded-t transition-all relative"
                          title={`Посетители: ${day.visitors}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap z-10">
                            {day.visitors} чел.
                          </span>
                        </div>
                        {/* Plays bar */}
                        <div
                          style={{ height: `${Math.max(pHeight, 12)}%` }}
                          className="w-1/2 max-w-[18px] bg-indigo-500/80 hover:bg-indigo-400 rounded-t transition-all relative"
                          title={`Прослушивания: ${day.plays}`}
                        >
                          <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700 whitespace-nowrap z-10">
                            {day.plays} аудио
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-2">{day.date}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-sky-500" />
                  <span className="text-slate-300">Посетители (Визиты)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-indigo-500" />
                  <span className="text-slate-300">Прослушивания аудиоуроков</span>
                </div>
              </div>
            </div>

            {/* Popular Lessons Widget */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-400" /> Топ популярных уроков
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Самые воспроизводимые записи каталога</p>

                <div className="mt-4 space-y-2.5">
                  {(analytics?.popularLessons?.length ? analytics.popularLessons : catalog.lessons.slice(0, 5).map((l, i) => ({
                    id: l.id,
                    title: l.title,
                    count: 24 - i * 4,
                    courseTitle: catalog.courses.find((c) => c.id === l.courseId)?.title,
                  }))).slice(0, 5).map((item, index) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-medium text-slate-200 truncate">{item.title}</p>
                          {item.courseTitle && (
                            <p className="text-[10px] text-slate-400 truncate">{item.courseTitle}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 font-mono shrink-0">
                        {item.count} 🎧
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab('lessons')}
                className="w-full mt-4 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-sky-400 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Перейти ко всем урокам</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Online Users & Registered Visitors Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" /> Пользователи бота и статус онлайн
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Список зарегистрированных посетителей, время последней активности и прослушанные материалы
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full self-start">
                В сети: {analytics?.onlineCount || 1}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 border-b border-slate-700 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Статус</th>
                    <th className="py-2.5 px-3">Пользователь / ID</th>
                    <th className="py-2.5 px-3">Платформа</th>
                    <th className="py-2.5 px-3">Действий</th>
                    <th className="py-2.5 px-3">Прослушано</th>
                    <th className="py-2.5 px-3">Последний визит</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {(analytics?.users?.length ? analytics.users : [
                    {
                      id: '@mant!m',
                      username: 'mant!m',
                      firstName: 'Admin Mant!m',
                      platform: 'telegram',
                      isOnline: true,
                      interactionsCount: 42,
                      lessonsPlayed: ['1', '2', '3'],
                      lastSeen: new Date().toISOString(),
                    },
                    {
                      id: '789123456',
                      username: 'student_ufa',
                      firstName: 'Руслан',
                      platform: 'telegram',
                      isOnline: false,
                      interactionsCount: 15,
                      lessonsPlayed: ['1', '2'],
                      lastSeen: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
                    },
                  ]).map((u, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        {u.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Онлайн
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-800 border border-slate-700">
                            <Clock className="w-2.5 h-2.5" />
                            Офлайн
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium">
                        <div className="text-white">
                          {u.username ? `@${u.username}` : u.firstName || `ID: ${u.id}`}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {u.id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          u.platform === 'telegram'
                            ? 'bg-sky-950 text-sky-300 border border-sky-800/50'
                            : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                        }`}>
                          {u.platform === 'telegram' ? '📱 Telegram' : '💻 Web-клиент'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-200">
                        {u.interactionsCount}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-300">
                        {u.lessonsPlayed?.length || 0} уроков
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(u.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        <span className="text-[10px] text-slate-500 ml-1.5">
                          ({new Date(u.lastSeen).toLocaleDateString()})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-time Activity Logs Stream */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-emerald-400" /> Лента последних действий пользователей (Live Log)
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(analytics?.recentEvents?.length ? analytics.recentEvents : [
                {
                  id: 'e1',
                  timestamp: Date.now() - 30000,
                  userName: '@mant!m',
                  action: 'play_lesson',
                  details: 'Прослушивание урока: «Урок 1: Введение в науку Таухид»',
                },
                {
                  id: 'e2',
                  timestamp: Date.now() - 120000,
                  userName: 'student_ufa',
                  action: 'search',
                  details: 'Поиск по каталогу: «таджвид»',
                },
                {
                  id: 'e3',
                  timestamp: Date.now() - 300000,
                  userName: 'student_ufa',
                  action: 'start',
                  details: 'Запуск бота /start',
                },
              ]).map((event) => (
                <div
                  key={event.id}
                  className="text-xs p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-mono shrink-0">
                      {event.userName}
                    </span>
                    <span className="text-slate-200 truncate">{event.details}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: CATEGORIES & COURSES MANAGEMENT (Управление темами)     */}
      {/* ============================================================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          {/* Create New Category Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <FolderPlus className="w-4 h-4 text-sky-400" /> Создать новую общую тематику (Уровень 1)
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Название тематики *
                  </label>
                  <input
                    type="text"
                    value={newCatTitle}
                    onChange={(e) => setNewCatTitle(e.target.value)}
                    placeholder="Например: Изучение Корана и Таджвид, Акида, Фикх..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Иконка
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="w-16 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-sm text-white focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex gap-1">
                      {['📂', '📖', '🕌', '💡', '📜', '🎧'].map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setNewCatIcon(icon)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs"
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCat || !newCatTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-sky-500/25 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Создать тему</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Existing Categories */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Существующие тематики ({catalog.categories.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {catalog.categories.map((cat) => {
                const catCourses = catalog.courses.filter((c) => c.categoryId === cat.id);
                const catLessons = catalog.lessons.filter((l) => l.categoryId === cat.id);
                const isEditing = editingCatId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {isEditing ? (
                        <div className="space-y-2 mb-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editCatIcon}
                              onChange={(e) => setEditCatIcon(e.target.value)}
                              className="w-12 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm text-white"
                            />
                            <input
                              type="text"
                              value={editCatTitle}
                              onChange={(e) => setEditCatTitle(e.target.value)}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleUpdateCategory(cat.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[11px] text-white flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Сохранить
                            </button>
                            <button
                              onClick={() => setEditingCatId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-700 text-[11px] text-slate-300"
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                              {cat.icon || '📂'}
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-white">{cat.title}</h3>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {catCourses.length} групп(ы) уроков • {catLessons.length} аудиозаписей
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditCatTitle(cat.title);
                                setEditCatIcon(cat.icon || '📂');
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                              title="Редактировать тему"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40"
                              title="Удалить тему и вложенные материалы"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Course list inside this category */}
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Группы уроков (Курсы):
                        </span>
                        {catCourses.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Пока нет курсов в этой теме</p>
                        ) : (
                          <div className="space-y-1">
                            {catCourses.map((c) => {
                              const lessonsInCourse = catalog.lessons.filter((l) => l.courseId === c.id);
                              return (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-800/40 border border-slate-700/40"
                                >
                                  <span className="text-slate-200 font-medium">📘 {c.title}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {lessonsInCourse.length} аудио
                                    </span>
                                    <button
                                      onClick={() => handleDeleteCourse(c)}
                                      className="text-slate-500 hover:text-rose-400"
                                      title="Удалить курс"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-800/60">
                      <span>ID: {cat.id}</span>
                      <button
                        onClick={() => {
                          setSelectedCatForCourse(cat.id);
                          setUploadCatId(cat.id);
                          setActiveSubTab('upload');
                        }}
                        className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                      >
                        <span>Добавить урок сюда</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Add Course Modal / Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <PlusCircle className="w-4 h-4 text-indigo-400" /> Добавить новую группу уроков / курс (Уровень 2)
            </h2>
            <form onSubmit={handleCreateCourse} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Родительская тематика *
                  </label>
                  <select
                    value={selectedCatForCourse}
                    onChange={(e) => setSelectedCatForCourse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {catalog.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '📂'} {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Название группы уроков *
                  </label>
                  <input
                    type="text"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="Например: Правила чтения Корана (Таджвид с нуля)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Краткое описание курса
                  </label>
                  <input
                    type="text"
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    placeholder="Краткий конспект серии..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!newCourseTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Создать курс</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: UPLOAD AUDIO LESSON (Загрузка аудиоурока и описание)   */}
      {/* ============================================================= */}
      {activeSubTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-sky-400" /> Загрузка и публикация аудиоурока (Уровень 3)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Укажите тематику, курс, название и подробное текстовое описание с таймкодами
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Публикация в бот
              </span>
            </div>

            <form onSubmit={handleUploadLesson} className="space-y-4">
              {/* Category & Course Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    1. Тематика (Категория) *
                  </label>
                  <select
                    value={uploadCatId}
                    onChange={(e) => setUploadCatId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {catalog.categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '📂'} {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    2. Группа уроков (Курс) *
                  </label>
                  <select
                    value={uploadCourseId}
                    onChange={(e) => setUploadCourseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {catalog.courses
                      .filter((c) => c.categoryId === uploadCatId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          📘 {c.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Lesson Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  3. Название аудиоурока *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Например: Урок 5: Правило Идгам и практические примеры"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Description & Notes with Timecodes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    4. Подробное описание и конспект к аудиоуроку
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadDesc(
                        `Краткий конспект урока и основные правила.\n\nТаймкоды:\n00:00 — Введение и повторение\n03:15 — Разбор ключевого правила\n07:30 — Практические примеры чтения\n11:45 — Заключение и домашнее задание`
                      );
                    }}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Вставить шаблон описания
                  </button>
                </div>
                <textarea
                  rows={5}
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  placeholder="Напишите краткий конспект урока, тезисы, ссылки на литературу или таймкоды..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              {/* Direct Audio File Drag & Drop Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Прямая загрузка аудиофайла с устройства (.mp3, .m4a, .ogg, .wav)
                </label>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleSelectLocalAudio(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                    isDraggingFile
                      ? 'border-sky-400 bg-sky-950/40 shadow-lg shadow-sky-500/10'
                      : selectedAudioFile
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-950/60'
                  }`}
                >
                  <input
                    type="file"
                    id="audio-file-input"
                    accept="audio/*,.mp3,.m4a,.ogg,.wav,.aac,.flac"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleSelectLocalAudio(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {selectedAudioFile ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left overflow-hidden">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileAudio className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate max-w-[280px] sm:max-w-md">
                              {selectedAudioFile.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-semibold shrink-0">
                              Готов к загрузке
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {(selectedAudioFile.size / (1024 * 1024)).toFixed(2)} МБ • {uploadDurationMin} мин. {uploadDurationSec} сек.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {audioFilePreviewUrl && (
                          <audio
                            controls
                            src={audioFilePreviewUrl}
                            className="h-8 max-w-[180px] sm:max-w-[200px]"
                          />
                        )}
                        <label
                          htmlFor="audio-file-input"
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Заменить
                        </label>
                        <button
                          type="button"
                          onClick={handleClearSelectedAudio}
                          className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                          title="Удалить выбранный файл"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="audio-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center py-2"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white mb-1">
                        Перетащите аудиофайл сюда или нажмите для выбора с устройства
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Поддерживаются MP3, M4A, OGG, WAV, AAC (до 100 МБ)
                      </p>
                    </label>
                  )}
                </div>

                {audioUploadProgress && (
                  <div className="mt-2 text-xs text-sky-400 flex items-center gap-2 bg-sky-950/40 border border-sky-800/40 px-3 py-2 rounded-xl">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{audioUploadProgress}</span>
                  </div>
                )}
              </div>

              {/* Duration and File Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Длительность (минут:секунд)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={uploadDurationMin}
                      onChange={(e) => setUploadDurationMin(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-sky-500"
                    />
                    <span className="text-slate-500">:</span>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={uploadDurationSec}
                      onChange={(e) => setUploadDurationSec(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Имя аудиофайла (.mp3)
                  </label>
                  <input
                    type="text"
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    placeholder="lesson_audio.mp3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telegram file_id (опционально)
                  </label>
                  <input
                    type="text"
                    value={uploadFileId}
                    onChange={(e) => setUploadFileId(e.target.value)}
                    placeholder="BAACAgIAAxkBA_..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Web Audio Stream URL (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Прямая ссылка на аудиопоток (URL) для Web-плеера
                </label>
                <input
                  type="url"
                  value={uploadAudioUrl}
                  onChange={(e) => setUploadAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio/lesson1.mp3 (если есть прямая ссылка)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploadingLesson || !uploadTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingLesson ? 'Публикация...' : 'Опубликовать аудиоурок'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Telegram Message Preview Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Предпросмотр в Telegram-боте
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                Так сообщение с аудиозаписью будет отображаться у пользователей бота при выборе:
              </p>

              {/* Simulated Telegram Audio Message Bubble */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-inner">
                {/* Audio Bubble Header */}
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white shrink-0">
                    <Play className="w-4 h-4 translate-x-0.5" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {uploadTitle.trim() || 'Название аудиоурока'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {catalog.courses.find((c) => c.id === uploadCourseId)?.title || 'Курс'} •{' '}
                      {uploadDurationMin}:{(uploadDurationSec || 0).toString().padStart(2, '0')} мин.
                    </p>
                  </div>
                </div>

                {/* Caption / Description text */}
                <div className="mt-3 text-xs text-slate-300 whitespace-pre-line bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 font-sans">
                  <p className="font-bold text-white mb-1">
                    🎵 {uploadTitle.trim() || 'Название урока'}
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    {uploadDesc.trim() || 'Здесь будет отображаться подробное описание урока, правила и таймкоды...'}
                  </p>
                </div>

                {/* Simulated Telegram Buttons */}
                <div className="mt-3 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="py-1.5 px-2 rounded-lg bg-sky-950/60 border border-sky-800/40 text-[10px] text-center text-sky-300 font-medium">
                      ⏮ Предыдущий
                    </div>
                    <div className="py-1.5 px-2 rounded-lg bg-sky-950/60 border border-sky-800/40 text-[10px] text-center text-sky-300 font-medium">
                      Следующий ⏭
                    </div>
                  </div>
                  <div className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-center text-slate-300">
                    📋 К списку уроков курса
                  </div>
                  <div className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-center text-slate-300">
                    🏠 В главное меню
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <span className="font-semibold text-amber-400">💡 Совет администратору:</span>
              <p className="text-[11px] text-slate-400 mt-1">
                Все загруженные аудиоуроки сразу становятся доступны пользователям в боте @Shukran_ufa_bot и индексируются поиском.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: LESSONS LIST & EDITING (Все уроки и редактирование)     */}
      {/* ============================================================= */}
      {activeSubTab === 'lessons' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
                placeholder="Поиск по урокам или описанию..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                <option value="all">Все тематики ({catalog.lessons.length})</option>
                {catalog.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || '📂'} {c.title}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setActiveSubTab('upload')}
                className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs text-white font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-sky-500/20 whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Добавить урок</span>
              </button>
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-3">
            {filteredLessons.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <FileAudio className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-300 font-medium">Уроки не найдены</p>
                <p className="text-xs text-slate-500 mt-1">Попробуйте изменить поисковый фильтр</p>
              </div>
            ) : (
              filteredLessons.map((lesson) => {
                const isEditing = editingLessonId === lesson.id;
                const isPlaying = playingLessonId === lesson.id;
                const category = catalog.categories.find((c) => c.id === lesson.categoryId);
                const course = catalog.courses.find((c) => c.id === lesson.courseId);

                return (
                  <div
                    key={lesson.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 transition-all ${
                      isPlaying ? 'border-sky-500/80 shadow-md shadow-sky-500/10' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {isEditing ? (
                      /* Editing Mode */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Название урока:
                          </label>
                          <input
                            type="text"
                            value={editLessonTitle}
                            onChange={(e) => setEditLessonTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                            Описание и конспект:
                          </label>
                          <textarea
                            rows={4}
                            value={editLessonDesc}
                            onChange={(e) => setEditLessonDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSaveLessonEdit(lesson.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" /> Сохранить изменения
                          </button>
                          <button
                            onClick={() => setEditingLessonId(null)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 flex-1">
                          {/* Play Button */}
                          <button
                            onClick={() => handleTogglePlay(lesson)}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                              isPlaying
                                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                            title={isPlaying ? 'Остановить' : 'Прослушать'}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 translate-x-0.5" />
                            )}
                          </button>

                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white">{lesson.title}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')} мин.
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <span className="text-sky-400 font-medium">
                                {category?.icon || '📂'} {category?.title || 'Категория'}
                              </span>
                              <span>•</span>
                              <span className="text-indigo-300 font-medium">
                                📘 {course?.title || 'Курс'}
                              </span>
                            </div>

                            {/* Description block */}
                            {lesson.description && (
                              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 whitespace-pre-line font-sans">
                                {lesson.description}
                              </div>
                            )}

                            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                              <span>file_id: {lesson.fileId.substring(0, 20)}...</span>
                              <span>•</span>
                              <span>Файл: {lesson.fileName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 sm:self-start shrink-0">
                          <button
                            onClick={() => handleStartEditLesson(lesson)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1 transition-colors"
                            title="Редактировать название и описание"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Изменить</span>
                          </button>

                          <button
                            onClick={() => handleDeleteLesson(lesson)}
                            className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                            title="Удалить аудиоурок"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: TELEGRAM CHANNEL INGESTION (Закрытый канал & Команды)   */}
      {/* ============================================================= */}
      {activeSubTab === 'channel' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" /> Интеграция с Telegram-группами и каналом
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Автоматическая загрузка аудиоуроков из групп, проверка на дубликаты и команда <strong className="text-amber-400">«проверь»</strong>
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 shrink-0">
              Активно в группах
            </span>
          </div>

          {/* Special Feature Card: Команда 'проверь' и Защита от дубликатов */}
          <div className="bg-gradient-to-r from-emerald-950/50 via-slate-950 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">
                    Команда «проверь» в группах и предотвращение дубликатов
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Активировано
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Когда бот добавлен в группу или канал, участники и администраторы могут проверить наличие урока, просто ответив (Reply) словом «<strong className="text-emerald-400">проверь</strong>» (или <code className="text-sky-300 font-mono">/проверь</code>) на аудиосообщение:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-800/40 text-xs space-y-1.5">
                    <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Если урок уже есть в каталоге:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Бот <strong>заново добавлять его не будет</strong>! Он отправит в ответ карточку урока (категория, курс, номер, file_id) со ссылкой на прослушивание.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/90 border border-sky-800/40 text-xs space-y-1.5">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Если урока ещё нет в базе:
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Бот автоматически определит тематику (по названию «Акыда», «Фикх» или подписи) и <strong>зарегистрирует новый урок</strong> в каталог.
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 font-mono">
                  💡 Также в группе можно написать «<code>проверь Акыда</code>» или «<code>проверь Таухид</code>» — бот выполнит поиск по всей базе уроков и покажет найденные совпадения.
                </div>
              </div>
            </div>
          </div>

          {/* Database Duplicate Audit & Real-time Verification */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" /> Аудит базы данных на отсутствие дубликатов
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Проверка уникальности Telegram file_id и названий аудиоуроков в каталоге
                </p>
              </div>

              <button
                id="btn-run-duplicate-audit"
                onClick={runDuplicateAudit}
                disabled={isCheckingDuplicates}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-sky-600/20 transition-all self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingDuplicates ? 'animate-spin' : ''}`} />
                <span>{isCheckingDuplicates ? 'Проверка...' : 'Проверить базу на дубликаты'}</span>
              </button>
            </div>

            {duplicateAudit ? (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  {duplicateAudit.hasDuplicates ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Найдены дубликаты: {duplicateAudit.duplicateLessons.length}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Все уроки уникальны! Дубликатов не найдено (100% чистота)
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Всего уроков в базе: <strong className="text-white">{duplicateAudit.totalLessons}</strong>
                  </span>
                </div>

                {duplicateAudit.duplicateLessons.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <p className="text-xs text-amber-300 font-semibold">Список повторяющихся уроков:</p>
                    {duplicateAudit.duplicateLessons.map((l: any, i: number) => (
                      <div key={i} className="text-xs text-slate-300 bg-slate-950 p-2 rounded-lg font-mono flex items-center justify-between">
                        <span>• {l.title} (Курс ID: {l.courseId})</span>
                        <span className="text-[10px] text-slate-500">ID: {l.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                <span>В базе сейчас <strong>{catalog.lessons.length}</strong> уроков. Нажмите кнопку выше для полной сверки file_id и названий.</span>
                <span className="text-emerald-400 font-semibold text-[11px]">Защита от повторов активна</span>
              </div>
            )}
          </div>

          {/* Interactive 'Проверь' Simulator in Admin UI */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-amber-400" /> Интерактивный симулятор команды «проверь»
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Протестируйте, как бот ответит на команду «проверь [запрос]» в чате или при отправке аудиофайла:
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={testCheckQuery}
                onChange={(e) => setTestCheckQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTestCheck(testCheckQuery);
                }}
                placeholder="Введите название урока или ключевое слово (например: Акыда, Таухид, Урок 1)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleTestCheck(testCheckQuery)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Проверить</span>
              </button>
            </div>

            {testCheckResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                {testCheckResult.found ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Совпадение найдено! Урок уже есть в каталоге (заново добавлять не нужно):</span>
                    </div>
                    <div className="space-y-1.5 pl-5 border-l-2 border-emerald-500/40">
                      {testCheckResult.matches.map((m) => {
                        const crs = catalog.courses.find((c) => c.id === m.courseId)?.title || 'Курс';
                        const cat = catalog.categories.find((c) => c.id === m.categoryId)?.title || 'Тематика';
                        return (
                          <div key={m.id} className="text-slate-200">
                            🎵 <strong>{m.title}</strong> — Урок #{m.order} ({crs}, «{cat}»)
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              file_id: {m.fileId.substring(0, 24)}... | Длительность: {Math.floor(m.duration / 60)} мин.
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Info className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      По запросу «<strong className="text-white">{testCheckResult.query}</strong>» совпадений не найдено. При отправке такого аудиофайла бот зарегистрирует его как новый урок.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit Logs of Ingestion Attempts */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-indigo-400" /> Журнал обработки аудиофайлов и защиты от дубликатов
              </h3>
              <button
                onClick={fetchLogs}
                disabled={isLogsLoading}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                title="Обновить журнал"
              >
                <RefreshCw className={`w-3 h-3 ${isLogsLoading ? 'animate-spin text-sky-400' : ''}`} />
                <span>Обновить</span>
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Журнал пока пуст. При отправке аудиозаписей в Telegram-бота или закрытую группу здесь отобразится статус обработки и предотвращения дубликатов.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.status === 'success' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                            ✅ Добавлен
                          </span>
                        )}
                        {log.status === 'duplicate_skipped' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60">
                            ℹ️ Дубликат пропущен
                          </span>
                        )}
                        {log.status === 'rejected_unauthorized' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800/60">
                            ⛔ Не авторизован
                          </span>
                        )}
                        {log.status === 'parse_error' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-950 text-orange-300 border border-orange-800/60">
                            ⚠️ Ошибка подписи
                          </span>
                        )}
                        <span className="text-slate-400 text-[11px] font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Structured Format Instruction & Group Upload Guide */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" /> Способ 1: Прямая отправка в Telegram-группу (без жестких шаблонов)
              </h3>
              <div className="text-xs text-slate-300 space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-800">
                <p>
                  Бот поддерживает любые типы аудиозаписей из групп: <strong>MP3, M4A, WAV, FLAC, голосовые сообщения (Voice)</strong> и аудио-документы.
                </p>
                <p>
                  Автоматическое распределение по тематикам (Таухид, Акыда, Фикх, Коран, Хадисы, Сира, Ахляк, Арабский, Python и др.). Даже если ключевое слово не найдено, урок <strong>не отклоняется</strong>, а сохраняется в раздел по названию группы!
                </p>
                <ul className="list-disc list-inside space-y-1 text-emerald-400 font-mono text-[11px]">
                  <li>«Акыда_урок_01.mp3» → помещается в «Основы Ислама и Акыда»</li>
                  <li>«Фикх очищения часть 2.mp3» → помещается в «Исламское право (Фикх)»</li>
                  <li>Голосовое сообщение с подписью или названием → регистрируется без ошибок</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" /> Способ 2: Структурированная подпись (по желанию)
              </h3>
              <pre className="text-xs text-emerald-400 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono leading-relaxed overflow-x-auto">
{`Тематика: Основы Ислама и Акыда
Группа: Таухид и столпы веры
Название: Урок 4: Смысл свидетельства Ля иляха илля Ллах
Описание: Подробный разбор условий шахады и того, что делает ее недействительной.`}
              </pre>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/50 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-indigo-400" /> Почему некоторые уроки в группе могли не добавиться ранее:
              </h4>
              <ul className="text-slate-300 text-[11px] space-y-1.5 list-disc list-inside">
                <li>
                  <strong>Сообщения, отправленные до добавления бота:</strong> боты Telegram не видят историю до момента их вступления в группу. <em>Решение:</em> ответьте (Reply) на старые сообщения словом «<code className="text-amber-300">проверь</code>» или «<code className="text-amber-300">добавь</code>», и бот сразу добавит их в базу!
                </li>
                <li>
                  <strong>Group Privacy (приватность Telegram):</strong> по умолчанию боты в группах видят только команды, начинающиеся с «/». <em>Решение:</em> назначьте бота <strong>Администратором группы</strong> или отключите приватность в <code className="text-sky-300">@BotFather → Bot Settings → Group Privacy → Turn off</code>.
                </li>
                <li>
                  <strong>Диагностика:</strong> отправьте в группу команду <code className="text-emerald-300">/группа</code> для мгновенной проверки прав и статуса подключения.
                </li>
              </ul>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-300 mb-1">
              <Shield className="w-4 h-4" /> Доверенные администраторы и группы
            </h4>
            <p className="text-slate-300 text-[11px]">
              Основной администратор: <strong className="text-white">@mant1m</strong> (ID: <code>289884572</code>). Загрузка аудио из подключенных групп разрешена всем участникам группы, а дубликаты автоматически исключаются по цифровому отпечатку (file_id) и названию.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
