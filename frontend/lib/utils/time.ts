/**
 * Time formatting utilities for the learning platform
 */

/**
 * Format duration from seconds to MM:SS or HH:MM:SS format
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format duration in a human-readable format (e.g., "2h 30m", "45m", "5m")
 */
export function formatDurationHuman(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
  
  if (minutes > 0) {
    return `${minutes}m`;
  }
  
  return '< 1m';
}

/**
 * Calculate remaining time from lessons array and progress map
 */
export function calculateRemainingTime(
  lessons: Array<{ id: string; video?: { duration: number } }>, 
  progressMap: Map<string, { is_completed: boolean }>
): string {
  const remainingSeconds = lessons
    .filter(lesson => !progressMap.get(lesson.id)?.is_completed)
    .reduce((sum, lesson) => sum + (lesson.video?.duration || 0), 0);
  
  return formatDurationHuman(remainingSeconds);
}

/**
 * Calculate total time from lessons array
 */
export function calculateTotalTime(
  lessons: Array<{ video?: { duration: number } }>
): string {
  const totalSeconds = lessons.reduce((sum, lesson) => sum + (lesson.video?.duration || 0), 0);
  return formatDurationHuman(totalSeconds);
}