import { ParsedCaption } from '../types';

/**
 * Parses administrative structured caption according to the template:
 * 
 * Тематика: [Название темы]
 * Группа: [Название курса/группы]
 * Название: [Тема урока / Номер]
 * Описание: [Краткий конспект или таймкоды]
 */
export function parseAdminCaption(caption: string): ParsedCaption {
  const result: ParsedCaption = {
    categoryTitle: '',
    courseTitle: '',
    lessonTitle: '',
    description: '',
    isValid: false,
    missingFields: [],
  };

  if (!caption || typeof caption !== 'string') {
    result.missingFields = ['Тематика', 'Группа', 'Название', 'Описание'];
    return result;
  }

  const lines = caption.split('\n');
  let currentKey: 'category' | 'course' | 'lesson' | 'description' | null = null;
  const descriptionLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check key prefixes (case-insensitive and tolerant of colon variations)
    const categoryMatch = line.match(/^тематика\s*:\s*(.*)$/i);
    const courseMatch = line.match(/^(?:группа|курс)\s*:\s*(.*)$/i);
    const lessonMatch = line.match(/^(?:название|урок|тема)\s*:\s*(.*)$/i);
    const descriptionMatch = line.match(/^описание\s*:\s*(.*)$/i);

    if (categoryMatch) {
      currentKey = 'category';
      result.categoryTitle = categoryMatch[1].trim();
    } else if (courseMatch) {
      currentKey = 'course';
      result.courseTitle = courseMatch[1].trim();
    } else if (lessonMatch) {
      currentKey = 'lesson';
      result.lessonTitle = lessonMatch[1].trim();
    } else if (descriptionMatch) {
      currentKey = 'description';
      if (descriptionMatch[1].trim()) {
        descriptionLines.push(descriptionMatch[1].trim());
      }
    } else if (currentKey === 'description') {
      // Continuation of description (e.g. multi-line notes or timecodes)
      descriptionLines.push(rawLine);
    }
  }

  result.description = descriptionLines.join('\n').trim();

  // Validate required fields
  if (!result.categoryTitle) result.missingFields.push('Тематика');
  if (!result.courseTitle) result.missingFields.push('Группа (Курс)');
  if (!result.lessonTitle) result.missingFields.push('Название');
  if (!result.description) result.missingFields.push('Описание');

  result.isValid = result.missingFields.length === 0;

  return result;
}

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function generateFileId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let rand = '';
  for (let i = 0; i < 32; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `BAACAgIAAxkBAAIBF_${rand}_AgAD`;
}
