export interface SpeakingExam {
    id: string;
    title: string;
    level: string;
    formula: '2023';
    source: 'official-structure';
    warmup: {
        questions: string[];
    };
    task1: {
        title: string;
        instruction: string;
        points: string[];
        aiRole: string;
    };
    task2: {
        title: string;
        instruction: string;
        imageUrl: string;
        aiQuestions: string[];
        requiredElements: string[];
    };
    task3: {
        title: string;
        instruction: string;
        options: string[];
        aiQuestions: string[];
        requiredElements: string[];
    };
}

export const SPEAKING_EXAMS: SpeakingExam[] = [
    {
        id: 'exam-1',
        title: 'Zestaw 1: Podróżowanie (Travel)',
        level: 'B1/B1+',
        formula: '2023',
        source: 'official-structure',
        warmup: {
            questions: [
                "Do you like travelling?",
                "How do you usually spend your holidays?",
                "Tell me about a place you would like to visit."
            ]
        },
        task1: {
            title: "Zadanie 1. Rozmowa z odgrywaniem roli",
            instruction: "Jesteś na wakacjach w Wielkiej Brytanii. Rozmawiasz z recepcjonistą w hostelu. Poniżej podane są 4 kwestie, które musisz omówić w rozmowie z egzaminującym.",
            points: [
                "Zapytaj o dostępność pokoju jednoosobowego.",
                "Zapytaj o cenę za jedną noc.",
                "Dowiedz się, czy śniadanie jest wliczone w cenę.",
                "Zapytaj o dostęp do Wi-Fi i godzinę zameldowania."
            ],
            aiRole: "You are a receptionist at a hostel in London. The student is a tourist asking for a room. Be helpful but ask for details like dates."
        },
        task2: {
            title: "Zadanie 2. Opis ilustracji",
            instruction: "Opisz ilustrację, którą widzisz na ekranie. Następnie odpowiedz na pytania egzaminującego.",
            imageUrl: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", // Tourists on beach
            aiQuestions: [
                "Why do you think these people chose this destination?",
                "Do you prefer spending holidays by the sea or in the mountains?",
                "Tell me about your last holiday trip."
            ],
            requiredElements: [
                "Describe the picture in detail.",
                "Answer question 1 from examiner.",
                "Answer question 2 from examiner.",
                "Answer question 3 from examiner."
            ]
        },
        task3: {
            title: "Zadanie 3. Wypowiedź na podstawie materiału stymulującego",
            instruction: "Masz dwie opcje spędzenia wolnego weekendu. Wybierz jedną opcję i uzasadnij wybór. Wyjaśnij, dlaczego odrzucasz drugą opcję. Następnie odpowiedz na dwa pytania egzaminującego.",
            options: [
                "A weekend city break with museum visits.",
                "A weekend hiking trip in the mountains."
            ],
            aiQuestions: [
                "Which factors are most important for you when planning free time?",
                "Do you think active rest is better than passive rest? Why?"
            ],
            requiredElements: [
                "Choose one option.",
                "Justify your choice.",
                "Explain why you reject the other option.",
                "Answer both examiner follow-up questions."
            ]
        }
    },
    {
        id: 'exam-2',
        title: 'Zestaw 2: Technologia (Technology)',
        level: 'B1/B1+',
        formula: '2023',
        source: 'official-structure',
        warmup: {
            questions: [
                "Do you use social media often?",
                "What is your favourite mobile app?",
                "Do you think technology makes our lives easier?"
            ]
        },
        task1: {
            title: "Zadanie 1. W sklepie elektronicznym",
            instruction: "Jesteś w sklepie w Londynie. Chcesz kupić nowy laptop. Porozmawiaj ze sprzedawcą i omów poniższe kwestie.",
            points: [
                "Wyjaśnij, do czego potrzebujesz laptopa (szkoła/gry).",
                "Zapytaj o cenę konkretnego modelu.",
                "Zapytaj o długość gwarancji.",
                "Zapytaj o możliwość rat lub zniżki studenckiej."
            ],
            aiRole: "You are a shop assistant in an electronics store. The student wants to buy a laptop. Ask about their budget and needs."
        },
        task2: {
            title: "Zadanie 2. Opis ilustracji",
            instruction: "Opisz ilustrację, którą widzisz na ekranie. Następnie odpowiedz na pytania egzaminującego.",
            imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", // Computer setup
            aiQuestions: [
                "Do you think spending too much time before a screen is healthy?",
                "How has the internet changed the way people learn?",
                "Tell me about a situation when technology failed you."
            ],
            requiredElements: [
                "Describe the picture in detail.",
                "Answer question 1 from examiner.",
                "Answer question 2 from examiner.",
                "Answer question 3 from examiner."
            ]
        },
        task3: {
            title: "Zadanie 3. Wypowiedź na podstawie materiału stymulującego",
            instruction: "Wybierz jedną z dwóch opcji dotyczących korzystania z technologii w szkole. Uzasadnij wybór, odrzuć drugą opcję i odpowiedz na dwa pytania egzaminującego.",
            options: [
                "Tablets for all students during lessons.",
                "Traditional books with limited technology use."
            ],
            aiQuestions: [
                "What digital skills are most useful for teenagers today?",
                "Should schools limit smartphone use during breaks?"
            ],
            requiredElements: [
                "Choose one option.",
                "Justify your choice.",
                "Explain why you reject the other option.",
                "Answer both examiner follow-up questions."
            ]
        }
    },
    {
        id: 'exam-3',
        title: 'Zestaw 3: Zdrowie (Health)',
        level: 'B1/B1+',
        formula: '2023',
        source: 'official-structure',
        warmup: {
            questions: [
                "Do you try to eat healthy food?",
                "What do you do to keep fit?",
                "Is health important to young people now?"
            ]
        },
        task1: {
            title: "Zadanie 1. U lekarza",
            instruction: "Jesteś u lekarza podczas wizyty w Anglii. Źle się czujesz. Porozmawiaj z lekarzem i omów poniższe kwestie.",
            points: [
                "Opisz swoje objawy (ból głowy, gorączka).",
                "Zapytaj, czy musisz zostać w łóżku.",
                "Zapytaj o receptę na lekarstwa.",
                "Zapytaj, kiedy możesz wrócić do szkoły."
            ],
            aiRole: "You are a doctor in a clinic. The student is a patient who is not feeling well. Ask about symptoms and give advice."
        },
        task2: {
            title: "Zadanie 2. Opis ilustracji",
            instruction: "Opisz ilustrację, którą widzisz na ekranie. Następnie odpowiedz na pytania egzaminującego.",
            imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80", // Healthy food
            aiQuestions: [
                "Why do some people choose to become vegetarians?",
                "Should schools sell only healthy food in their shops?",
                "Tell me about a time when you were ill."
            ],
            requiredElements: [
                "Describe the picture in detail.",
                "Answer question 1 from examiner.",
                "Answer question 2 from examiner.",
                "Answer question 3 from examiner."
            ]
        },
        task3: {
            title: "Zadanie 3. Wypowiedź na podstawie materiału stymulującego",
            instruction: "Wybierz jedną propozycję poprawy zdrowia w szkole, uzasadnij wybór, odrzuć drugą propozycję i odpowiedz na dwa pytania egzaminującego.",
            options: [
                "Daily morning stretching sessions at school.",
                "A school campaign focused on healthy meals only."
            ],
            aiQuestions: [
                "What is the biggest health problem among teenagers now?",
                "Who should be more responsible for healthy habits: school or family?"
            ],
            requiredElements: [
                "Choose one option.",
                "Justify your choice.",
                "Explain why you reject the other option.",
                "Answer both examiner follow-up questions."
            ]
        }
    }
];
