import { useState, useEffect } from 'react';
import { GRAMMAR_SECTIONS } from '../services/grammarData';
import { addXP, saveTaskResult, getStats, saveMistake } from '../services/storageService';
import { useChatContext } from '../contexts/ChatContext';
import { getCompletion } from '../services/geminiService';
import { handleAIError } from '../services/errorService';
import { GrammarTask } from '../types';

export const useGrammar = () => {
    const [sections, setSections] = useState(GRAMMAR_SECTIONS);
    const [activeSectionId, setActiveSectionId] = useState(GRAMMAR_SECTIONS[0].id);
    const [activeTaskId, setActiveTaskId] = useState<string>(GRAMMAR_SECTIONS[0].tasks[0].id);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { setScreenContext } = useChatContext();

    const activeSection = sections.find(s => s.id === activeSectionId);
    const activeTask = activeSection?.tasks.find(t => t.id === activeTaskId);

    // Load history
    useEffect(() => {
        const stats = getStats();
        const completedTasks: Record<string, boolean> = {};
        stats.history.forEach(entry => {
            if (entry.module === 'grammar') {
                completedTasks[entry.taskId] = true;
            }
        });
        setSubmitted(completedTasks);
    }, []);

    // Set Chat Context
    useEffect(() => {
        if (activeTask) {
            const qs = activeTask.questions.map(q => `${q.id}. ${q.prefix || ''} ${q.text || ''} ${q.suffix || ''}`).join('\n');
            setScreenContext(`
        MODUŁ: GRAMATYKA
        Typ: ${activeSection?.title}
        Polecenie: ${activeTask.instruction}
        Kontekst/Reguła: ${activeTask.content || activeSection?.description}
        Pytania: ${qs}
      `);
        }
    }, [activeTask, activeSection, setScreenContext]);

    // Ensure valid activeTaskId when section changes
    useEffect(() => {
        if (activeSection && activeSection.tasks.length > 0) {
            const taskExists = activeSection.tasks.find(t => t.id === activeTaskId);
            if (!taskExists) setActiveTaskId(activeSection.tasks[0].id);
        }
    }, [activeSectionId, activeSection]);

    const generateAiTask = async () => {
        if (isGenerating || !activeSection) return;
        setIsGenerating(true);

        try {
            setError(null);
            // FEW-SHOT EXAMPLES & PROMPT ENGINEERING
            const getGrammarPrompt = (type: string, description: string) => {
                const examples = type.includes('Tłumaczenie')
                    ? `PRZYKŁADY (Tłumaczenie):
                   1. "I (nie widziałem)" -> prefix: "I", text: "(nie widziałem)", suffix: "him since May.", correctAnswer: ["haven't seen", "have not seen"]
                   2. "If I (byłbym)" -> prefix: "If I", text: "(byłbym)", suffix: "you, I would go there.", correctAnswer: ["were", "was"]`
                    : type.includes('Parafrazy')
                        ? `PRZYKŁADY (Parafrazy):
                   1. "It is not necessary to help me." -> "You (don't have to) help me." -> options: ["A. mustn't", "B. don't have to", "C. can't"] -> correctAnswer: "B. don't have to"
                   2. "I regret selling my car." -> "I wish I (hadn't sold) my car." -> options: ["A. didn't sell", "B. hadn't sold", "C. haven't sold"] -> correctAnswer: "B. hadn't sold"`
                        : `PRZYKŁADY (Wybór wielokrotny):
                   1. "I have lived here ___ 2010." -> options: ["A. since", "B. for", "C. from"] -> correctAnswer: "A. since"
                   2. "This is the boy ___ father is a doctor." -> options: ["A. who", "B. whose", "C. that"] -> correctAnswer: "B. whose"`;

                return `
                Jesteś EKSPERTEM CKE (Centralna Komisja Egzaminacyjna). Twoim zadaniem jest stworzenie TRUDNEGO zadania maturalnego (Poziom B1/B1+).
                
                TYP ZADANIA: ${type}
                OPIS: ${description}

                ${examples}

                ZASADY GENEROWANIA "PUŁAPEK":
                1. Używaj "false friends" (np. actually vs aktualnie).
                2. Testuj wyjątki gramatyczne (np. let/make someone DO something).
                3. W tłumaczeniach wymagaj precyzji (czasy Perfect, tryby warunkowe).
                
                FORMATOWANIE:
                - Dla zadań wyboru (A/B/C), 'correctAnswer' MUSI być pełnym ciągiem znaków (np. "A. since").

                Zwróć JSON z 5 nowymi przykładami:
                {
                  "instruction": "Tytuł zadania (np. CHALLENGE: ${type} - ${new Date().toLocaleDateString()})",
                  "questions": [
                    {
                      "id": 1,
                      "text": "Treść/Zdanie",
                      "prefix": "...", "suffix": "...", // Tylko dla tłumaczeń
                      "options": ["A. ...", "B. ...", "C. ..."], // Wybór wielokrotny
                      "correctAnswer": "odpowiedź (string lub array)"
                    }
                  ]
                }
              `;
            };

            const prompt = getGrammarPrompt(activeSection.title, activeSection.description);

            const jsonText = await getCompletion(prompt, true);
            const generatedData = JSON.parse(jsonText || '{}');

            if (generatedData.questions && generatedData.questions.length > 0) {
                const newTaskId = `ai-${Date.now()}`;
                const newTask: GrammarTask = {
                    id: newTaskId,
                    type: activeSection.tasks[0].type,
                    instruction: generatedData.instruction || "Zestaw wygenerowany przez NVIDIA AI",
                    questions: generatedData.questions
                };

                setSections(prev => prev.map(s => {
                    if (s.id === activeSectionId) return { ...s, tasks: [...s.tasks, newTask] };
                    return s;
                }));

                setActiveTaskId(newTaskId);
                setSubmitted(prev => ({ ...prev, [newTaskId]: false }));
            }
        } catch (e) {
            const aiError = handleAIError(e);
            setError(aiError.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInputChange = (taskId: string, questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [`${taskId}-${questionId}`]: value }));
    };

    const isCorrect = (userAns: string, correct: string | string[]) => {
        if (!userAns) return false;
        const normalizedUser = userAns.trim().toLowerCase();
        if (Array.isArray(correct)) return correct.some(c => c.toLowerCase() === normalizedUser);
        return correct.toLowerCase() === normalizedUser;
    };

    const checkAnswers = (taskId: string) => {
        setSubmitted(prev => ({ ...prev, [taskId]: true }));
        const task = activeSection?.tasks.find(t => t.id === taskId);
        if (task) {
            let correctCount = 0;
            task.questions.forEach(q => {
                const userAns = answers[`${taskId}-${q.id}`];
                if (isCorrect(userAns, q.correctAnswer)) {
                    correctCount++;
                } else {
                    saveMistake('grammar', `${q.prefix || ''} ${q.text || ''} ${q.suffix || ''}`.trim(), userAns || '', Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer, task.instruction);
                }
            });
            saveTaskResult('grammar', correctCount, task.questions.length, taskId);
            // Optional: trigger reload of xp/stats if needed via context or listening to event
        }
    };

    const cycleNextTask = () => {
        if (!activeSection || !activeTask) return;
        const currentIndex = activeSection.tasks.findIndex(t => t.id === activeTask.id);
        if (currentIndex < activeSection.tasks.length - 1) {
            setActiveTaskId(activeSection.tasks[currentIndex + 1].id);
        } else {
            generateAiTask();
        }
    };

    const retryTask = (taskId: string) => {
        const task = activeSection?.tasks.find(t => t.id === taskId);
        if (!task) return;

        setSubmitted(prev => ({ ...prev, [taskId]: false }));
        setAnswers(prev => {
            const next = { ...prev };
            task.questions.forEach(q => {
                delete next[`${taskId}-${q.id}`];
            });
            return next;
        });
    };

    return {
        sections,
        activeSection,
        activeSectionId,
        setActiveSectionId,
        activeTask,
        activeTaskId,
        setActiveTaskId,
        answers,
        submitted,
        isGenerating,
        error,
        handleInputChange,
        checkAnswers,
        generateAiTask,
        isCorrect,
        cycleNextTask,
        retryTask
    };
};
