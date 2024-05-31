import sanitizeUploadedSVG from './sanitize-svg';

export function jobSanitizeUploadedFilesTasksRun(context) {
  const sanitizeTasks = [sanitizeUploadedSVG];

  sanitizeTasks.forEach(task => task(context));
}
