import React, { useEffect, useState } from 'react';
import { Play, Pause, FileAudio, Copy, Check, Clock } from 'lucide-react';
import { audioPlayer } from '../utils/audioSynth';
import { formatDuration } from '../utils/telegramBotLogic';

interface TelegramAudioPlayerProps {
  lessonId: string;
  title: string;
  courseTitle?: string;
  duration: number;
  fileId: string;
  fileName?: string;
  description?: string;
  audioUrl?: string;
}

export const TelegramAudioPlayer: React.FC<TelegramAudioPlayerProps> = ({
  lessonId,
  title,
  courseTitle,
  duration,
  fileId,
  fileName,
  description,
  audioUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [copiedFileId, setCopiedFileId] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(true);

  useEffect(() => {
    const unsubscribe = audioPlayer.subscribe((time, playing) => {
      const state = audioPlayer.getState();
      if (state.currentLessonId === lessonId) {
        setIsPlaying(playing);
        setCurrentTime(time);
      } else {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    });

    // Check initial
    const state = audioPlayer.getState();
    if (state.currentLessonId === lessonId) {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
    }

    return unsubscribe;
  }, [lessonId]);

  const togglePlay = () => {
    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play(lessonId, duration, currentTime, audioUrl);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    audioPlayer.seek(val);
    if (!isPlaying) {
      audioPlayer.play(lessonId, duration, val, audioUrl);
    }
  };

  const copyId = () => {
    navigator.clipboard?.writeText(fileId);
    setCopiedFileId(true);
    setTimeout(() => setCopiedFileId(false), 2000);
  };

  // Helper to detect timecodes like "01:25" or "00:00" and make them clickable
  const renderInteractiveDescription = (text: string) => {
    const timecodeRegex = /(\b(?:[0-5]?[0-9]):(?:[0-5][0-9])\b)/g;
    const parts = text.split(timecodeRegex);

    return (
      <div className="space-y-1 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
        {parts.map((part, idx) => {
          if (timecodeRegex.test(part)) {
            const [m, s] = part.split(':').map(Number);
            const totalSec = m * 60 + s;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentTime(totalSec);
                  audioPlayer.play(lessonId, duration, totalSec);
                }}
                className="inline-flex items-center text-sky-400 font-mono hover:text-sky-300 underline underline-offset-2 px-1 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 mx-0.5 cursor-pointer"
                title={`Перейти к ${part}`}
              >
                <Clock className="w-3 h-3 mr-0.5" />
                {part}
              </button>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 p-3.5 shadow-sm space-y-3 max-w-full">
      {/* Top row: Play/Pause button + Track info */}
      <div className="flex items-start space-x-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/30 transition-transform active:scale-95 cursor-pointer"
          title={isPlaying ? 'Пауза' : 'Слушать'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-white truncate" title={title}>
              {title}
            </h4>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
          </div>

          <p className="text-xs text-sky-300/90 truncate font-medium">
            {courseTitle || fileName || 'Аудиоурок'}
          </p>

          {/* Scrubbable seeker bar */}
          <div className="mt-2 flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>
      </div>

      {/* Telegram File ID indicator & copy pill */}
      <div className="flex items-center justify-between text-[11px] bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 font-mono">
        <div className="flex items-center space-x-1.5 text-slate-400 truncate mr-2">
          <FileAudio className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-slate-500">file_id:</span>
          <span className="truncate text-slate-300" title={fileId}>
            {fileId}
          </span>
        </div>
        <button
          type="button"
          onClick={copyId}
          className="text-slate-400 hover:text-white shrink-0 flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-800"
          title="Скопировать Telegram file_id"
        >
          {copiedFileId ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Скопирован</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>

      {/* Description & Interactive Timecodes */}
      {description && (
        <div className="border-t border-slate-700/60 pt-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Конспект и таймкоды
            </span>
            <button
              type="button"
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="text-[11px] text-sky-400 hover:text-sky-300"
            >
              {showFullDesc ? 'Свернуть' : 'Развернуть'}
            </button>
          </div>
          {showFullDesc && renderInteractiveDescription(description)}
        </div>
      )}
    </div>
  );
};
