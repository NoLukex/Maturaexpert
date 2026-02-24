import { FullExam } from '../services/examData';

export interface ExamValidationIssue {
  level: 'error' | 'warning';
  message: string;
}

export const validateExam = (exam: FullExam): ExamValidationIssue[] => {
  const issues: ExamValidationIssue[] = [];
  const computedScore = exam.sections
    .flatMap((section) => section.tasks)
    .reduce((sum, task) => sum + task.score, 0);

  if (computedScore !== exam.totalScore) {
    issues.push({
      level: 'error',
      message: `Suma punktow zadan (${computedScore}) nie zgadza sie z totalScore (${exam.totalScore}).`
    });
  }

  exam.sections.forEach((section) => {
    section.tasks.forEach((task) => {
      if (task.type !== 'writing' && (!task.questions || task.questions.length === 0)) {
        issues.push({ level: 'error', message: `Brak pytan w zadaniu ${task.title}.` });
      }

      if (task.type === 'writing' && !task.writingTask) {
        issues.push({ level: 'error', message: `Brak writingTask w zadaniu ${task.title}.` });
      }
    });
  });

  if (exam.sourceType === 'adapted') {
    issues.push({
      level: 'warning',
      message: 'Arkusz oznaczony jako rekonstrukcja robocza. Wymaga podmiany tresci 1:1 z CKE.'
    });
  }

  return issues;
};
