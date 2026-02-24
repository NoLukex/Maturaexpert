export type TaskType = 'true_false' | 'matching' | 'choice';

export interface ListeningQuestion {
  id: number;
  text: string;
  options?: string[];
  correctAnswer: string | number;
}

export interface ListeningTask {
  id: string;
  title: string;
  type: TaskType;
  description: string;
  script: string;
  questions: ListeningQuestion[];
  matchingOptions?: string[];
}

export const LISTENING_TASKS: ListeningTask[] = [
  {
    id: 'l1',
    title: 'Zadanie 1. Wolontariat',
    type: 'true_false',
    description: 'Uslyszysz rozmowe z chlopakiem, ktory pracuje jako wolontariusz. Zdecyduj, ktore zdania sa zgodne z trescia nagrania (T), a ktore nie (F).',
    script: `
      Interviewer: So, Tom, tell us about your volunteer work. Why did you decide to help at the animal shelter?
      Tom: Well, I've always loved animals. My parents didn't want a dog at home, so I thought this would be a great way to spend time with them.
      Interviewer: What exactly do you do there?
      Tom: Mostly I feed the cats and clean their cages. It's not always pleasant, especially the cleaning part, but seeing them happy makes it worth it. Sometimes I also take the dogs for a walk in the nearby park.
      Interviewer: Is it hard work?
      Tom: Physically, yes. I'm often tired after my shift. But emotionally, it gives me a lot of energy. I recommend it to everyone.
    `,
    questions: [
      { id: 1, text: 'Tom started volunteering because he was bored.', correctAnswer: 'False' },
      { id: 2, text: 'Tom\'s main duties involve feeding animals and cleaning.', correctAnswer: 'True' },
      { id: 3, text: 'Tom finds the work physically easy.', correctAnswer: 'False' }
    ]
  },
  {
    id: 'l2',
    title: 'Zadanie 2. Gotowanie',
    type: 'matching',
    description: 'Uslyszysz cztery wypowiedzi na temat gotowania. Do kazdej wypowiedzi (1-4) dopasuj odpowiadajace jej zdanie (A-E). Jedno zdanie zostalo podane dodatkowo.',
    script: `
      Speaker 1: I absolutely hate cooking. It takes so much time! You have to buy ingredients, prepare everything, and then clean up the mess. I prefer ordering pizza or going to a restaurant with my friends.
      
      Speaker 2: For me, cooking is an art. I love experimenting with new spices and recipes from different countries. Last week I made a traditional Japanese soup. My family loved it!
      
      Speaker 3: I cook because I have to. I'm a student and I don't have much money for restaurants. I usually make simple things like pasta or scrambled eggs. It's cheap and fast.
      
      Speaker 4: My grandmother taught me how to bake cakes when I was a child. Now, every weekend I bake something sweet for my children. The smell of fresh cake in the house is the best feeling in the world.
    `,
    matchingOptions: [
      'A. I cook to save money.',
      'B. I enjoy trying exotic dishes.',
      'C. I cook for my family tradition.',
      'D. I dislike preparing meals.',
      'E. I want to become a professional chef.'
    ],
    questions: [
      { id: 1, text: 'Speaker 1', correctAnswer: 'D' },
      { id: 2, text: 'Speaker 2', correctAnswer: 'B' },
      { id: 3, text: 'Speaker 3', correctAnswer: 'A' },
      { id: 4, text: 'Speaker 4', correctAnswer: 'C' }
    ]
  },
  {
    id: 'l3',
    title: 'Zadanie 3. Lotnisko',
    type: 'choice',
    description: 'Uslyszysz komunikat na lotnisku. Z podanych odpowiedzi wybierz wlasciwa.',
    script: `
      Attention passengers. This is an announcement for passengers of flight BA452 to London Heathrow. 
      We are sorry to inform you that the flight has been delayed by two hours due to heavy fog in London. 
      The new departure time is 10:30 PM. 
      Passengers are invited to the "Sky Lounge" restaurant where you can get a free hot meal and a drink. 
      Please keep your boarding passes ready. Thank you for your patience.
    `,
    questions: [
      {
        id: 1,
        text: 'The flight is going to:',
        options: ['A. New York', 'B. London', 'C. Paris'],
        correctAnswer: 1
      },
      {
        id: 2,
        text: 'The flight is delayed because of:',
        options: ['A. Bad weather', 'B. Technical problems', 'C. Late crew'],
        correctAnswer: 0
      },
      {
        id: 3,
        text: 'Passengers can get for free:',
        options: ['A. A meal and a drink', 'B. A ticket upgrade', 'C. A newspaper'],
        correctAnswer: 0
      }
    ]
  },
  {
    id: 'l4',
    title: 'Zadanie 4. Technologie',
    type: 'matching',
    description: 'Uslyszysz cztery osoby mowiace o technologii. Dopasuj zdania (A-E) do osob (1-4).',
    script: `
      Speaker 1: I use my smartphone for everything. Mostly for staying in touch with my friends via social media apps. I check my notifications every five minutes!
      
      Speaker 2: Computers are essential for my work. I'm a graphic designer, so I need a powerful laptop with a big screen to edit photos and design websites.
      
      Speaker 3: I love playing video games. I bought a new console last month and the graphics are amazing. It helps me relax after a long day at school.
      
      Speaker 4: I use the internet mainly for learning. There are so many great tutorials on YouTube. I learnt how to play the guitar just by watching videos online.
    `,
    matchingOptions: [
      'A. I use technology for entertainment/gaming.',
      'B. I use it for professional purposes.',
      'C. It helps me communicate with others.',
      'D. It is a great educational tool.',
      'E. I think technology is dangerous.'
    ],
    questions: [
      { id: 1, text: 'Speaker 1', correctAnswer: 'C' },
      { id: 2, text: 'Speaker 2', correctAnswer: 'B' },
      { id: 3, text: 'Speaker 3', correctAnswer: 'A' },
      { id: 4, text: 'Speaker 4', correctAnswer: 'D' }
    ]
  },
  {
    id: 'l5',
    title: 'Zadanie 5. Przyjecie',
    type: 'true_false',
    description: 'Uslyszysz rozmowe Alice i Marka o przyjeciu urodzinowym. Ocen prawdziwosc zdan.',
    script: `
      Alice: Mark, are you coming to Sarah's birthday party on Saturday?
      Mark: I'm not sure, Alice. I haven't bought a present for her yet. Do you have any ideas?
      Alice: She loves reading crime stories. Maybe a new book?
      Mark: That's a good idea. But I also have to study for my math exam on Monday. The party starts at 8 PM, right?
      Alice: Yes. Come on, you can study in the morning! It will be fun.
      Mark: Okay, you convinced me. I'll go to the bookshop tomorrow.
    `,
    questions: [
      { id: 1, text: 'Mark has already bought a present for Sarah.', correctAnswer: 'False' },
      { id: 2, text: 'Sarah enjoys reading romantic novels.', correctAnswer: 'False' },
      { id: 3, text: 'Mark decides to go to the party.', correctAnswer: 'True' }
    ]
  },
  {
    id: 'l6',
    title: 'Zadanie 6. Wakacje',
    type: 'choice',
    description: 'Uslyszysz historie o wakacjach. Wybierz poprawna odpowiedz.',
    script: `
      Last summer my family and I went to Italy. We drove there by car because my father is afraid of flying. 
      The journey was very long, it took almost 20 hours! 
      When we finally arrived at the hotel, it turned out that they lost our reservation. 
      We had to sleep in the car for the first night. Can you imagine? 
      Luckily, the next day they found us a nice room with a sea view. The rest of the holiday was perfect.
    `,
    questions: [
      {
        id: 1,
        text: 'How did they travel to Italy?',
        options: ['A. By plane', 'B. By train', 'C. By car'],
        correctAnswer: 2
      },
      {
        id: 2,
        text: 'What was the problem at the hotel?',
        options: ['A. The room was dirty', 'B. There was no reservation', 'C. It was too expensive'],
        correctAnswer: 1
      },
      {
        id: 3,
        text: 'Where did they sleep the first night?',
        options: ['A. In another hotel', 'B. On the beach', 'C. In their vehicle'],
        correctAnswer: 2
      }
    ]
  }
];
