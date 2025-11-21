export const subjectColors = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#14b8a6',
  '#6366f1',
  '#ef4444',
];

export function getRandomColor(): string {
  return subjectColors[Math.floor(Math.random() * subjectColors.length)];
}
