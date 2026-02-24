import { ExamTask } from '../services/examData';

interface ExamSection {
  name: string;
  tasks: ExamTask[];
}

export interface ClosedExamEvaluation {
  closedPoints: number;
  mistakes: string[];
}

const normalizeTextAnswer = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:]/g, '')
    .replace(/\s+/g, ' ');

const normalizeChoiceAnswer = (value: unknown): string => String(value ?? '').trim().toLowerCase();

const isCorrectAnswer = (correctAnswer: string | string[] | number, userAnswer: unknown): boolean => {
  if (Array.isArray(correctAnswer)) {
    const normalizedUser = normalizeTextAnswer(userAnswer);
    return correctAnswer.some((answer) => normalizeTextAnswer(answer) === normalizedUser);
  }

  if (typeof correctAnswer === 'string') {
    return normalizeChoiceAnswer(userAnswer) === normalizeChoiceAnswer(correctAnswer);
  }

  return String(userAnswer) === String(correctAnswer);
};

export const evaluateClosedTasks = (
  sections: ExamSection[],
  answers: Record<string, unknown>
): ClosedExamEvaluation => {
  let closedPoints = 0;
  const mistakes: string[] = [];

  sections.forEach((section) => {
    section.tasks.forEach((task) => {
      if (task.type === 'writing') return;

      let taskMistakes = 0;
      task.questions?.forEach((question) => {
        const userAnswer = answers[`${task.id}-${question.id}`];
        if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
          taskMistakes += 1;
          return;
        }

        if (isCorrectAnswer(question.correctAnswer, userAnswer)) {
          closedPoints += 1;
        } else {
          taskMistakes += 1;
        }
      });

      if (taskMistakes > 0) {
        mistakes.push(task.title);
      }
    });
  });

  return { closedPoints, mistakes };
};
