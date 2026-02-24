import { FullExam } from './examData';
import { MOCK_EXAMS } from './mockExams';

const mayExam = MOCK_EXAMS.find((exam) => exam.id === 'matura-may-2023');
const augustBase = MOCK_EXAMS.find((exam) => exam.id === 'matura-june-2024');

if (!mayExam || !augustBase) {
  throw new Error('Brak wymaganych zestawow bazowych do konfiguracji egzaminow 2023.');
}

const juneSections = mayExam.sections.map((section) => ({
  ...section,
  tasks: section.tasks.map((task) => {
    if (task.id === 'may23-5a') {
      return {
        ...task,
        taskImages: [
          '/exams/2023/images/task5a_page8_2306.png',
          '/exams/2023/images/task5b_page9_2306.png'
        ]
      };
    }

    if (task.id === 'may23-10') {
      return {
        ...task,
        taskImages: ['/exams/2023/images/task10_page17_2306.png']
      };
    }

    return { ...task };
  })
}));

export const CKE_2023_EXAMS: FullExam[] = [
  {
    ...mayExam,
    id: 'cke-2023-maj',
    title: 'Matura CKE - Maj 2023 (zweryfikowany)',
    date: '5 maja 2023',
    formula: '2023',
    session: 'maj',
    sourceType: 'official',
    sourceUrl: '/exams/2023/MJAP-P0-100-2305.pdf',
    answerKeyUrl: '/exams/2023/MJAP-P0-100-2305-zasady.pdf',
    transcriptUrl: '/exams/2023/MJAP-P0-100-2305-transkrypcja.pdf',
    audioUrl: '/exams/2023/MJAP-P0-100-2305.mp3'
  },
  {
    ...mayExam,
    id: 'cke-2023-czerwiec',
    title: 'Matura CKE - Czerwiec 2023 (1:1, arkusz CKE)',
    date: '6 czerwca 2023',
    formula: '2023',
    session: 'czerwiec',
    sourceType: 'official',
    sourceUrl: '/exams/2023/MJAP-P0-100-2306.pdf',
    answerKeyUrl: '/exams/2023/MJAP-P0-100-2306-zasady.pdf',
    transcriptUrl: '/exams/2023/MJAP-P0-100-2306-transkrypcja.pdf',
    audioUrl: '/exams/2023/MJAP-P0-100-2306.m4a',
    sections: juneSections
  },
  {
    ...augustBase,
    id: 'cke-2023-sierpien',
    title: 'Matura CKE - Sierpien 2023 (rekonstrukcja robocza)',
    date: 'Sierpien 2023',
    formula: '2023',
    session: 'sierpien',
    sourceType: 'adapted',
    sourceUrl: 'https://cke.gov.pl/egzamin-maturalny/egzamin-maturalny-w-formule-2023/arkusze/',
    answerKeyUrl: 'https://cke.gov.pl/egzamin-maturalny/egzamin-maturalny-w-formule-2023/arkusze/'
  }
];
