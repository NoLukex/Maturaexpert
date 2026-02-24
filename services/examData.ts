import { WritingTask } from "../types";

export interface ExamQuestion {
  id: number;
  text?: string;
  prefix?: string; // For gap fills/translations
  suffix?: string;
  options?: string[]; // For multiple choice (text)
  optionsType?: 'text' | 'image'; // New field for image support
  optionImages?: string[]; // Paths to images if optionsType is 'image'
  correctAnswer: string | string[] | number; // Support for multiple correct answers (open tasks)
}

export interface ExamTask {
  id: string;
  title: string;
  type: 'true_false' | 'matching' | 'choice' | 'gapped_text' | 'open_cloze' | 'translation' | 'writing';
  instruction: string;
  score: number; // Max points for this task

  // Content
  script?: string; // For listening
  readingText?: string; // For reading
  taskImages?: string[]; // For official CKE image blocks
  readingParts?: { id: number | string, text: string }[]; // For matching reading
  extraOptions?: string[]; // For matching (A-F)

  questions?: ExamQuestion[];
  writingTask?: WritingTask; // Specific structure for writing
}

export interface FullExam {
  id: string;
  title: string;
  date: string;
  formula?: '2023' | '2015' | 'mixed';
  session?: 'maj' | 'czerwiec' | 'sierpien' | 'probna' | 'inna';
  sourceType?: 'official' | 'adapted';
  sourceUrl?: string;
  answerKeyUrl?: string;
  transcriptUrl?: string;
  audioUrl?: string;
  totalScore: number;
  duration: number; // minutes
  sections: {
    name: string;
    tasks: ExamTask[];
  }[];
}

export const EXAMS: FullExam[] = [
  {
    id: 'dec-2022',
    title: 'Matura Próbna Grudzień 2022',
    date: '13 grudnia 2022',
    totalScore: 60,
    duration: 120,
    sections: [
      {
        name: 'Rozumienie ze słuchu',
        tasks: [
          {
            id: 'dec-1',
            title: 'Zadanie 1. Lego Artist',
            type: 'true_false',
            score: 5,
            instruction: 'Usłyszysz dwukrotnie rozmowę ze znanym artystą. Zaznacz, które zdania są zgodne z treścią (True), a które nie (False).',
            script: `Woman: Today I’m talking to Nick Sanders, an artist who doesn’t use paints, stone or metal to create his works of art. Instead he makes sculptures out of Lego bricks. Nick, how did you become a Lego fan?
Man: I received my first box of Lego for Christmas when I was just five years old. I remember unpacking the present and building my first Lego house. Then, thanks to more gifts of Lego from my family, my collection got bigger and bigger. Five years later, when I was ten, I even built a life-size dog. I did this because my parents said I couldn’t have a real one.
Woman: When did you realize that playing with Lego could be more than a hobby?
Man: Ten years ago I used all the Lego bricks I already had at home to create a huge sculpture of myself, a sort of self-portrait. My family and friends were really impressed. They suggested I could do that for a living. I wasn’t sure at first, but then I decided to make a few more Lego sculptures. I put photos of them up on my website, and soon people from around the world started to order what I had created.
Woman: Is that when you decided to change your profession?
Man: Well, I wanted to do something more creative than being a lawyer. One day, there were so many requests on my website that it stopped working. I realized then that it was time to leave my job and start working full-time on Lego sculptures.`,
            questions: [
              { id: 1, text: 'Nick built a life-size Lego animal when he was 5 years old.', correctAnswer: 'False' },
              { id: 2, text: 'Nick had to buy a lot of new Lego bricks to make his self-portrait.', correctAnswer: 'False' },
              { id: 3, text: 'Nick\'s family and friends encouraged him to earn money by making Lego sculptures.', correctAnswer: 'True' },
              { id: 4, text: 'Nick sells his Lego sculptures online.', correctAnswer: 'True' },
              { id: 5, text: 'Nick regrets changing his job.', correctAnswer: 'False' }
            ]
          },
          {
            id: 'dec-2',
            title: 'Zadanie 2. Sleep',
            type: 'matching',
            score: 5,
            instruction: 'Usłyszysz dwukrotnie pięć wypowiedzi związanych z tematem snu. Dopasuj zdanie (A-F) do wypowiedzi (1-5).',
            script: `One: Do you ever fall asleep for a few minutes during the day? If so, you may want to make it a regular habit. Even a five-minute sleep in the afternoon can increase our energy levels and make us more creative.
Two: This must-see exhibition shows how sleep can inspire creativity. Each night, a different artist will sleep in a comfortable bed in the art gallery. As soon as they wake up, they will start to create a work of art.
Three: After a busy day of sightseeing, I was looking forward to a good night’s sleep. The hotel room was cheap. However, when it got dark, I realized there was a dance club in the building. I could hear loud techno beats all night long.
Four: The British weightlifter Jack Oliver had such a good night’s sleep in his hotel bed that he nearly missed his event at the 2012 Olympic Games. He slept straight through his alarm!
Five: We are a furniture company and we are looking for a bed-tester. You will be asked to sleep in a range of high-quality beds and provide a written review.`,
            extraOptions: [
              'A. offers work that involves sleeping.',
              'B. criticises the quality of the beds in a luxury hotel.',
              'C. recommends a cultural event connected with sleeping.',
              'D. talks about the benefits that daytime sleep can bring.',
              'E. complains about a situation in which sleep was impossible.',
              'F. describes how a good night’s sleep caused a stressful experience.'
            ],
            questions: [
              { id: 1, text: 'Speaker 1', correctAnswer: 'D' },
              { id: 2, text: 'Speaker 2', correctAnswer: 'C' },
              { id: 3, text: 'Speaker 3', correctAnswer: 'E' },
              { id: 4, text: 'Speaker 4', correctAnswer: 'F' },
              { id: 5, text: 'Speaker 5', correctAnswer: 'A' }
            ]
          },
          {
            id: 'dec-3',
            title: 'Zadanie 3. Wybór',
            type: 'choice',
            score: 5,
            instruction: 'Usłyszysz dwukrotnie dwa teksty. Z podanych odpowiedzi wybierz właściwą.',
            script: `Text 1: When I was 14 years old, I saw a poster outside our local theatre. It invited young people to apply for the main role in a Christmas play. I was a shy girl... As the day of the audition got closer, I became more and more nervous. But when I was finally on stage, I suddenly felt calm. I didn’t get the role, but those few minutes on stage were unforgettable. It was then that I decided to become an actress.

Text 2: 
Man: Today I’d like to welcome Judi and her guide dog Rex.
Woman: Rex is trained to guide me around objects. And when I want to cross a street, he always makes sure it is safe.
Man: Does he always do what he’s told?
Woman: Well, if there is a problem, he’ll refuse. Once I wanted to visit a friend when it was very cold. There was ice on the pavement. When we got to the gate, I told Rex to go forward, but he didn’t move.
Man: How do you reward Rex?
Woman: I just continually tell him what a good job he’s doing. And when we get home, I play games with him.`,
            questions: [
              { id: 1, text: '3.1. The speaker felt (Text 1)', options: ['A. relaxed while speaking on stage.', 'B. confident before going on stage.', 'C. proud that she got the part.'], correctAnswer: 0 },
              { id: 2, text: '3.2. The speaker (Text 1)', options: ['A. recommends a play.', 'B. gives advice on stress.', 'C. describes what influenced her career choice.'], correctAnswer: 2 },
              { id: 3, text: '3.3. Judi says that her dog, Rex (Text 2)', options: ['A. likes going to the park.', 'B. instinctively knows his way around.', 'C. remembers places he has been to.'], correctAnswer: 2 },
              { id: 4, text: '3.4. When her street was covered with ice (Text 2)', options: ['A. decided to change her plan.', 'B. let Rex choose a route.', 'C. got angry.'], correctAnswer: 0 },
              { id: 5, text: '3.5. To reward Rex, Judi (Text 2)', options: ['A. gives him snacks.', 'B. shows him she is pleased.', 'C. allows him to play with her grandson.'], correctAnswer: 1 }
            ]
          }
        ]
      },
      {
        name: 'Rozumienie tekstów pisanych',
        tasks: [
          {
            id: 'dec-4',
            title: 'Zadanie 4. Celebrities and Bees',
            type: 'matching',
            score: 4,
            instruction: 'Przeczytaj tekst. Dobierz właściwy nagłówek (A-F) do każdej części tekstu (4.1-4.4). Dwa nagłówki zostały podane dodatkowo.',
            readingText: `4.1. Morgan Freeman, the famous actor, decided to turn his 124-acre ranch in Mississippi into a bee sanctuary. He started keeping bees in 2014. He does not harvest honey from them; he just wants to help them survive. He feeds them sugar and water and has planted bee-friendly vegetation like clover, lavender, and magnolia trees.

4.2. David Beckham, the retired football star, found a new passion during the lockdown. He started beekeeping in his garden. He built the hives himself and was very excited when he collected his first harvest of honey. He often shares photos of his new hobby on social media, showing himself checking the hives.

4.3. Angelina Jolie wanted to raise awareness about the importance of protecting bees. For World Bee Day, she posed for a photo for National Geographic covered in live bees. She had to stand still for 18 minutes without moving while the bees crawled over her body. She said it was a beautiful experience connecting with nature.

4.4. Jennifer Garner, the Hollywood actress, co-founded a company that produces organic baby food. Her family farm grows fruit and vegetables, and they rely on bees for pollination. She often posts videos where she reads books to her bees or checks on them. She says that taking care of bees is similar to taking care of a garden.`,
            extraOptions: [
              'A. A STAR COMBINING FARMING WITH BUSINESS',
              'B. A NEW HOBBY OF A RETIRED SPORTSMAN',
              'C. AN ACTRESS HELPING TO PROTECT BEES',
              'D. AN ACTOR WHO MADE A HOME FOR BEES',
              'E. A FAMOUS PERSON WHO IS SCARED OF BEES',
              'F. A SCIENTIFIC DISCOVERY ABOUT BEES'
            ],
            questions: [
              { id: 1, text: 'Akapit 4.1', correctAnswer: 'D' },
              { id: 2, text: 'Akapit 4.2', correctAnswer: 'B' },
              { id: 3, text: 'Akapit 4.3', correctAnswer: 'C' },
              { id: 4, text: 'Akapit 4.4', correctAnswer: 'A' }
            ]
          },
          {
            id: 'dec-5',
            title: 'Zadanie 5. Eco-Friendly Habits',
            type: 'gapped_text',
            score: 7,
            instruction: 'Przeczytaj teksty (A-D). Wykonaj zadania 5.1-5.7. W zadaniach 5.1-5.3 wybierz właściwy tekst. W zadaniach 5.4-5.7 uzupełnij luki w języku angielskim.',
            readingText: `Tekst A: I used to buy coffee every morning on my way to work. I realized I was throwing away hundreds of paper cups every year. So, I bought a reusable cup. Now, many coffee shops give me a discount when I use it. It keeps my coffee warm for longer, too!
  
Tekst B: I realized how much plastic I was wasting by buying bottled water. It was also expensive. I decided to buy a water filter jug for my home and a durable metal bottle to carry with me. Now I can drink tap water safely and it tastes great.

Tekst C: Commercial cleaning products are full of strong chemicals that are bad for our health and the environment. I decided to make my own. I use simple ingredients like vinegar, lemon juice, and baking soda. They clean just as well as the expensive bottles from the shop, and they are much cheaper.

Tekst D: I love fashion, but I know that the clothing industry creates a lot of waste. Instead of buying new clothes, I organize "clothes swap" parties with my friends. We bring items we don't wear anymore and exchange them. It's a great way to refresh my wardrobe for free!`,
            questions: [
              { id: 1, text: '5.1. This text mentions a social event for exchanging items.', options: ['A', 'B', 'C', 'D'], correctAnswer: 'D' },
              { id: 2, text: '5.2. This text describes saving money on a daily drink.', options: ['A', 'B', 'C', 'D'], correctAnswer: 'A' },
              { id: 3, text: '5.3. This text is about making products at home.', options: ['A', 'B', 'C', 'D'], correctAnswer: 'C' },
              { id: 4, text: '5.4. (Tekst A) The author gets a ... when using their own cup.', correctAnswer: ['discount'] },
              { id: 5, text: '5.5. (Tekst B) The author stopped buying ... because of the plastic waste.', correctAnswer: ['bottled water', 'water bottles'] },
              { id: 6, text: '5.6. (Tekst C) The author uses vinegar and ... to clean.', correctAnswer: ['lemon juice', 'baking soda'] },
              { id: 7, text: '5.7. (Tekst D) The author refreshes their ... without spending money.', correctAnswer: ['wardrobe'] }
            ]
          },
          {
            id: 'dec-6',
            title: 'Zadanie 6. At Last',
            type: 'choice',
            score: 5,
            instruction: 'Przeczytaj tekst i wybierz poprawną odpowiedź.',
            readingText: `George Jackson was hiding with his bicycle in a dark side street... It was a full moon. The night was cloudless and clear... Suddenly he saw the lights. The blue Rolls-Royce appeared. The driver got out... Jackson saw that he was of medium height... Suddenly he went cold with fear as he saw the man dialing slowly. Was he calling the police?... The man came out, put the bag behind the phone box... Jackson hesitated. He ended up waiting for fifteen minutes... Jackson put the bag into his bicycle basket... At home... "At last," he whispered, "I think my worries are over."`,
            questions: [
              { id: 1, text: '6.1. When Jackson was hiding, the night was', options: ['A. stormy', 'B. warm', 'C. very dark', 'D. unusually cloudy'], correctAnswer: 1 },
              { id: 2, text: '6.2. Jackson felt scared because he', options: ['A. recognized the driver', 'B. saw the driver making a call', 'C. realized driver was detective', 'D. was sure driver worked for police'], correctAnswer: 1 },
              { id: 3, text: '6.3. When the bag was left, Jackson', options: ['A. waited for professor', 'B. didn\'t leave immediately', 'C. saw someone take bike', 'D. picked it up straight away'], correctAnswer: 1 },
              { id: 4, text: '6.4. At home Jackson felt', options: ['A. stressed', 'B. worried', 'C. hopeful', 'D. afraid'], correctAnswer: 2 },
              { id: 5, text: '6.5. This text describes a man who', options: ['A. robbed passer-by', 'B. found money', 'C. left money', 'D. got money in unusual circumstances'], correctAnswer: 3 }
            ]
          },
          {
            id: 'dec-7',
            title: 'Zadanie 7. Dark Stores',
            type: 'gapped_text',
            score: 4,
            instruction: 'Uzupełnij luki (7.1-7.4) w tekście zdaniami (A-E).',
            readingText: `'Dark stores' look like regular supermarkets... 7.1. ____ Instead, supermarket employees do the shopping... Although dark supermarkets are similar to normal shops inside, there are some differences. 7.2. ____ On both sides of them there are shelves... Dark stores are investing a lot of money in technology. 7.3. ____ There are also machines that help put the shopping into delivery vans... Some customers don't like staying at home. 7.4. ____ If you choose this option, you can stop on your way home.`,
            extraOptions: [
              'A. For example, pickers are equipped with handheld computers which tell them where to find products.',
              'B. One of these is that although there are aisles, they are wider than in your local supermarket.',
              'C. It is for this reason that they often prefer to pick up their shopping themselves.',
              'D. This design makes finding items in the shop very quick and easy.',
              'E. That is because shoppers are not allowed inside.'
            ],
            questions: [
              { id: 1, text: 'Luka 7.1', correctAnswer: 'E' },
              { id: 2, text: 'Luka 7.2', correctAnswer: 'B' },
              { id: 3, text: 'Luka 7.3', correctAnswer: 'A' },
              { id: 4, text: 'Luka 7.4', correctAnswer: 'C' }
            ]
          }
        ]
      },
      {
        name: 'Znajomość środków językowych',
        tasks: [
          {
            id: 'dec-8',
            title: 'Zadanie 8. Minidialogi',
            type: 'choice',
            score: 3,
            instruction: 'Uzupełnij minidialogi (8.1-8.3).',
            questions: [
              { id: 1, text: '8.1. X: I think you should apologize to her. Y: ____ X: That\'s good.', options: ['A. I was rude to her too.', 'B. I\'ve already done that.', 'C. I didn\'t do anything wrong.'], correctAnswer: 1 },
              { id: 2, text: '8.2. X: Tonight, I\'m going to the cinema with Mark. Y: ____ X: Thanks. I can\'t wait!', options: ['A. What\'s on at the cinema?', 'B. I think it\'s closed tonight.', 'C. Great! Have a good time.'], correctAnswer: 2 },
              { id: 3, text: '8.3. X: ____ Y: Certainly. What can I do for you?', options: ['A. Can I help you?', 'B. Did you need any help?', 'C. Could you help me, please?'], correctAnswer: 2 }
            ]
          },
          {
            id: 'dec-9',
            title: 'Zadanie 9. Gramatyka i Słownictwo',
            type: 'choice',
            score: 4,
            instruction: 'Wybierz wyraz, który poprawnie uzupełnia luki w obu zdaniach.',
            questions: [
              { id: 1, text: '9.1. There is nothing Ann likes ____ than playing video games. / I\'m glad that you feel much ____ today.', options: ['A. well', 'B. more', 'C. better'], correctAnswer: 2 },
              { id: 2, text: '9.2. Sally had to ____ after her baby brother. / If you don\'t know a word you should ____ it up.', options: ['A. check', 'B. look', 'C. take'], correctAnswer: 1 },
              { id: 3, text: '9.3. Dave can\'t play. He has ____ his leg. / She has ____ up with her boyfriend.', options: ['A. broken', 'B. turned', 'C. hurt'], correctAnswer: 0 },
              { id: 4, text: '9.4. I don\'t have enough ____ time. / Students are ____ to decide.', options: ['A. spare', 'B. extra', 'C. free'], correctAnswer: 2 }
            ]
          },
          {
            id: 'dec-10',
            title: 'Zadanie 10. Take Action',
            type: 'open_cloze',
            score: 3,
            instruction: 'Uzupełnij luki jednym wyrazem.',
            readingText: `Make a difference... On our website we give a lot of examples of what you 10.1. _____ do at home... Many organizations are taking action in order 10.2. _____ stop environmental damage... Why don't you take 10.3. _____ in these activities?`,
            questions: [
              { id: 1, text: '10.1', correctAnswer: ['can', 'could', 'should', 'must'] },
              { id: 2, text: '10.2', correctAnswer: ['to'] },
              { id: 3, text: '10.3', correctAnswer: ['part'] }
            ]
          },
          {
            id: 'dec-11',
            title: 'Zadanie 11. Tłumaczenie',
            type: 'translation',
            score: 3,
            instruction: 'Przetłumacz fragmenty w nawiasach.',
            questions: [
              { id: 1, prefix: '11.1. (Co zrobiłabyś)', text: '', suffix: 'if he invited you to the cinema?', correctAnswer: ['What would you do'] },
              { id: 2, prefix: '11.2. I hope our friends (spróbują pomóc)', text: '', suffix: 'us solve the problem.', correctAnswer: ['will try to help', 'will try helping', 'try to help'] },
              { id: 3, prefix: '11.3. Using this new app isn\'t (tak łatwe jak)', text: '', suffix: 'I expected.', correctAnswer: ['as easy as', 'so easy as'] }
            ]
          }
        ]
      },
      {
        name: 'Wypowiedź pisemna',
        tasks: [
          {
            id: 'dec-12',
            title: 'Zadanie 12. Wolontariat w Zoo',
            type: 'writing',
            score: 12,
            instruction: 'Właśnie spędzasz wakacje pracując jako wolontariusz w ogrodzie zoologicznym. Na forum internetowym:\n• napisz, dlaczego zdecydowałeś się zostać wolontariuszem w zoo\n• poinformuj, co należy do Twoich obowiązków\n• zrelacjonuj nietypowe wydarzenie podczas pracy\n• zachęć inne osoby do dołączenia do zespołu i poinformuj o warunkach.',
            writingTask: {
              id: 'exam-w-1',
              type: 'blog',
              title: 'Zadanie 12',
              instruction: `Właśnie spędzasz wakacje pracując jako wolontariusz w ogrodzie zoologicznym. Na forum internetowym:
• napisz, dlaczego zdecydowałeś się zostać wolontariuszem w zoo
• poinformuj, co należy do Twoich obowiązków
• zrelacjonuj nietypowe wydarzenie podczas pracy
• zachęć inne osoby do dołączenia do zespołu i poinformuj o warunkach.`
            }
          }
        ]
      }
    ]
  },
  {
    id: 'aug-2022',
    title: 'Matura Poprawkowa Sierpień 2022',
    date: '23 sierpnia 2022',
    totalScore: 50,
    duration: 120,
    sections: [
      {
        name: 'Rozumienie ze słuchu',
        tasks: [
          {
            id: 'aug-1',
            title: 'Zadanie 1. Silent Disco',
            type: 'true_false',
            score: 5,
            instruction: 'Usłyszysz fragment programu radiowego. Zaznacz prawdę (T) lub fałsz (F).',
            script: `Woman: Welcome to this week's program. Last Saturday evening, listeners called about a strange event in the city park. Hundreds of people dancing but no music playing! I invited the organizer, Mr. Steve Morgan.
Man: Hi. It was a silent disco.
Woman: Tell us more!
Man: Dancers wear headphones, so they hear music, but you can't.
Woman: Why here?
Man: People nearby don't like loud music at night. I saw this in France and thought it would be good here.
Woman: What music?
Man: Three DJs. Headphones light up with the colour of the DJ. Green, blue or red.
Woman: Will there be another one?
Man: Sure, next Saturday.`,
            questions: [
              { id: 1, text: 'Listeners informed the woman about a strange event.', correctAnswer: 'True' },
              { id: 2, text: 'Passers-by could not hear the music.', correctAnswer: 'True' },
              { id: 3, text: 'The man had organized a similar event in France.', correctAnswer: 'False' },
              { id: 4, text: 'You have to bring your own headphones.', correctAnswer: 'False' },
              { id: 5, text: 'People will have the chance to attend a similar event at the weekend.', correctAnswer: 'True' }
            ]
          },
          {
            id: 'aug-2',
            title: 'Zadanie 2. Weekend Jobs',
            type: 'matching',
            score: 4,
            instruction: 'Usłyszysz cztery wypowiedzi nastolatków o pracy w weekendy. Dopasuj zdania (A-E) do wypowiedzi (1-4).',
            script: `One: I work in a small cafe on Saturdays. I like it because I can meet many new people. However, my legs often hurt after eight hours of standing.
Two: I help my neighbour in his garden. I cut the grass and water the flowers. It is hard work, but I love being outside in the fresh air.
Three: I deliver newspapers in my neighbourhood. I have to get up very early, at 5 AM. It is difficult, especially when it is raining or snowing.
Four: I babysit for my aunt's children. They are very energetic and sometimes naughty. But we play games and watch cartoons, so it is usually fun.`,
            extraOptions: [
              'A. This person works outdoors.',
              'B. This person complains about getting up early.',
              'C. This person enjoys meeting customers.',
              'D. This person works with animals.',
              'E. This person looks after kids.'
            ],
            questions: [
              { id: 1, text: 'Speaker 1', correctAnswer: 'C' },
              { id: 2, text: 'Speaker 2', correctAnswer: 'A' },
              { id: 3, text: 'Speaker 3', correctAnswer: 'B' },
              { id: 4, text: 'Speaker 4', correctAnswer: 'E' }
            ]
          },
          {
            id: 'aug-3',
            title: 'Zadanie 3. Situations',
            type: 'choice',
            score: 6,
            instruction: 'Usłyszysz sześć tekstów. Z podanych odpowiedzi wybierz właściwą.',
            script: `Text 1: Attention passengers. The train to Manchester has been cancelled due to technical problems. Please go to the ticket office for a refund.
Text 2: Hi Mum, I'm at the shopping centre. I found the dress I wanted, but it's too expensive. Can you lend me some money?
Text 3: I visited the new museum yesterday. The paintings were beautiful, but the queue to get in was terrible. I waited for two hours!
Text 4: Woman: Can I help you? Man: Yes, I'm looking for a book about history. Woman: They are on the second floor, next to the science section.
Text 5: Welcome to our hotel. Breakfast is served from 7 to 10 AM in the restaurant. The swimming pool is open until 9 PM.
Text 6: I wanted to bake a cake, but I realized I didn't have any eggs. I had to run to the shop to buy them.`,
            questions: [
              { id: 1, text: '3.1. (Text 1) The announcement is made at', options: ['A. an airport', 'B. a train station', 'C. a bus stop'], correctAnswer: 1 },
              { id: 2, text: '3.2. (Text 2) The girl is calling her mother to', options: ['A. ask for money', 'B. describe a dress', 'C. say she is coming home'], correctAnswer: 0 },
              { id: 3, text: '3.3. (Text 3) The speaker complains about', options: ['A. the ticket price', 'B. the paintings', 'C. waiting for a long time'], correctAnswer: 2 },
              { id: 4, text: '3.4. (Text 4) The conversation takes place in', options: ['A. a library', 'B. a bookshop', 'C. a school'], correctAnswer: 1 },
              { id: 5, text: '3.5. (Text 5) Guests can swim', options: ['A. in the morning only', 'B. all day and night', 'C. until the evening'], correctAnswer: 2 },
              { id: 6, text: '3.6. (Text 6) The speaker went to the shop because', options: ['A. he wanted a cake', 'B. he needed an ingredient', 'C. he was hungry'], correctAnswer: 1 }
            ]
          }
        ]
      },
      {
        name: 'Rozumienie tekstów pisanych',
        tasks: [
          {
            id: 'aug-4',
            title: 'Zadanie 4. Mount Rushmore',
            type: 'matching',
            score: 4,
            instruction: 'Przeczytaj tekst. Dobierz nagłówek (A-F).',
            readingText: `4.1. Millions come to see heads of four presidents. Chosen by Gutzon Borglum. Washington = birth, Jefferson = rise, Roosevelt = development, Lincoln = strength.
4.2. Borglum began in 1927. Removing tons of rock. Heavy wind, rain, heat, cold.
4.3. Borglum had an idea of a secret room "The Hall of Records". Wanted to hold documents like Constitution.
4.4. Gov wanted to concentrate on faces. Borglum died. Son took over but only on monument. Hall not completed.`,
            extraOptions: [
              'A. WHY BUILDING THE MONUMENT WAS CHALLENGING',
              'B. HOW THE MONUMENT’S LOCATION WAS CHOSEN',
              'C. HOW “THE HALL OF RECORDS” WAS DECORATED',
              'D. WHAT THE HIDDEN HALL WAS INTENDED FOR',
              'E. WHY THE “HALL OF RECORDS” IS NOT READY',
              'F. WHAT THE MONUMENT SYMBOLISES'
            ],
            questions: [
              { id: 1, text: '4.1', correctAnswer: 'F' },
              { id: 2, text: '4.2', correctAnswer: 'A' },
              { id: 3, text: '4.3', correctAnswer: 'D' },
              { id: 4, text: '4.4', correctAnswer: 'E' }
            ]
          },
          {
            id: 'aug-5',
            title: 'Zadanie 5. The Sandwich',
            type: 'gapped_text',
            score: 3,
            instruction: 'Przeczytaj tekst. Uzupełnij luki (5.1-5.3) zdaniami (A-E).',
            readingText: `The sandwich is one of the most popular foods in the world. But do you know where it comes from? The story says it was invented by John Montagu, the 4th Earl of Sandwich, in the 18th century. 5.1. ____ He didn't want to stop playing to eat a meal. So, he asked his servant to bring him some meat between two slices of bread. 5.2. ____ Soon, other people started ordering "the same as Sandwich". Today, sandwiches are eaten everywhere. 5.3. ____ You can put almost anything inside, from cheese and ham to vegetables and even fruit.`,
            extraOptions: [
              'A. This allowed him to eat with one hand and continue playing with the other.',
              'B. He was a very busy man who loved playing cards.',
              'C. They are easy to make and perfect for a quick lunch.',
              'D. He decided to open a restaurant in London.',
              'E. People didn\'t like bread in those days.'
            ],
            questions: [
              { id: 1, text: '5.1', correctAnswer: 'B' },
              { id: 2, text: '5.2', correctAnswer: 'A' },
              { id: 3, text: '5.3', correctAnswer: 'C' }
            ]
          },
          {
            id: 'aug-6',
            title: 'Zadanie 6. The Rescue',
            type: 'choice',
            score: 5,
            instruction: 'Przeczytaj tekst. Z podanych odpowiedzi wybierz właściwą.',
            readingText: `One cold evening, Sarah was walking home from work. It was raining heavily, so she was walking fast. Suddenly, she heard a strange noise coming from a bush near the park. She stopped and listened. It sounded like a small animal crying. She moved the branches and saw a tiny puppy, wet and shaking with cold. It had no collar. Sarah couldn't leave it there. She took off her jacket, wrapped the puppy in it, and carried it home. She gave it some warm milk and a blanket. The next day, she took the puppy to the vet. The vet said it was healthy but hungry. Sarah decided to keep the puppy and named him Lucky.`,
            questions: [
              { id: 1, text: '6.1. What was the weather like?', options: ['A. It was snowing.', 'B. It was raining.', 'C. It was windy.'], correctAnswer: 1 },
              { id: 2, text: '6.2. Where did Sarah find the puppy?', options: ['A. In the park.', 'B. Near a bush.', 'C. On the street.'], correctAnswer: 1 },
              { id: 3, text: '6.3. What did Sarah do with her jacket?', options: ['A. She put it on.', 'B. She covered the puppy.', 'C. She lost it.'], correctAnswer: 1 },
              { id: 4, text: '6.4. The vet said the puppy was', options: ['A. sick.', 'B. injured.', 'C. healthy.'], correctAnswer: 2 },
              { id: 5, text: '6.5. This story is about', options: ['A. finding a new friend.', 'B. a bad day at work.', 'C. losing a pet.'], correctAnswer: 0 }
            ]
          },
          {
            id: 'aug-7',
            title: 'Zadanie 7. London Buses',
            type: 'gapped_text',
            score: 3,
            instruction: 'Przeczytaj tekst. Uzupełnij luki (7.1-7.3) wyrazami z ramki (A-F).',
            readingText: `London is famous for its red double-decker buses. They are a convenient way to travel around the city. You can enjoy great views from the top deck. 7.1. ____ However, you cannot pay with cash on the bus. You must use a travel card or a contactless bank card. The buses run 24 hours a day on some routes. 7.2. ____ This is very useful for people who work late at night. The most famous bus is the Routemaster, which has an open platform at the back. 7.3. ____ Although modern buses are more comfortable, many tourists still love the old design.`,
            extraOptions: [
              'A. TICKET',
              'B. SEAT',
              'C. NIGHT',
              'D. DRIVER',
              'E. STOPS',
              'F. DESIGN'
            ],
            questions: [
              { id: 1, text: '7.1. The text mentions payment methods.', correctAnswer: 'A' }, // Simplification for matching logic, really implies Context
              { id: 2, text: '7.2. The text mentions the time of operation.', correctAnswer: 'C' },
              { id: 3, text: '7.3. The text mentions the look of the bus.', correctAnswer: 'F' }
            ]
          }
        ]
      },
      {
        name: 'Znajomość środków językowych',
        tasks: [
          {
            id: 'aug-8',
            title: 'Zadanie 8. Healthy Sleep',
            type: 'choice',
            score: 5,
            instruction: 'Przeczytaj tekst. Z podanych odpowiedzi wybierz właściwą, tak aby otrzymać logiczny i gramatycznie poprawny tekst.',
            readingText: `Sleep is very important for our health. Doctors say that teenagers should sleep for about 8 to 10 hours every night. If you don't sleep enough, you might feel tired and find it difficult to concentrate at school. To get a good night's sleep, you 8.1. ____ avoid using your phone before bed. The blue light from the screen wakes up your brain. It is also a good idea to 8.2. ____ a book or listen to relaxing music. You shouldn't eat a heavy meal late 8.3. ____ night. A glass of warm milk can help you relax. Remember that sleep is 8.4. ____ important as healthy food and exercise. So, try to go to bed at the same time every day 8.5. ____ wake up feeling refreshed.`,
            questions: [
              { id: 1, text: '8.1', options: ['A. should', 'B. can', 'C. may'], correctAnswer: 0 },
              { id: 2, text: '8.2', options: ['A. read', 'B. reading', 'C. to read'], correctAnswer: 0 },
              { id: 3, text: '8.3', options: ['A. in', 'B. at', 'C. on'], correctAnswer: 1 },
              { id: 4, text: '8.4', options: ['A. as', 'B. so', 'C. like'], correctAnswer: 0 },
              { id: 5, text: '8.5', options: ['A. for', 'B. to', 'C. that'], correctAnswer: 1 }
            ]
          },
          {
            id: 'aug-9',
            title: 'Zadanie 9. Tłumaczenie',
            type: 'translation',
            score: 5,
            instruction: 'Przetłumacz na język angielski fragmenty podane w nawiasach, tak aby otrzymać logiczne i gramatycznie poprawne zdania.',
            questions: [
              { id: 1, prefix: '9.1. I promise I (zadzwonię)', text: '', suffix: 'you tomorrow.', correctAnswer: ['will call', "'ll call"] },
              { id: 2, prefix: '9.2. (Ile kosztuje)', text: '', suffix: 'this T-shirt?', correctAnswer: ['How much is', 'How much does'] },
              { id: 3, prefix: '9.3. My brother is (starszy niż)', text: '', suffix: 'me.', correctAnswer: ['older than'] },
              { id: 4, prefix: '9.4. We (nie byliśmy)', text: '', suffix: 'at the cinema yesterday.', correctAnswer: ['were not', "weren't"] },
              { id: 5, prefix: '9.5. She enjoys (słuchanie)', text: '', suffix: 'music.', correctAnswer: ['listening to'] }
            ]
          }
        ]
      },
      {
        name: 'Wypowiedź pisemna',
        tasks: [
          {
            id: 'aug-12',
            title: 'Zadanie 12. E-mail do kolegi',
            type: 'writing',
            score: 10,
            instruction: 'Podczas wakacji w Wielkiej Brytanii zgubiłeś/aś telefon. W e-mailu do kolegi z Londynu:\n• poinformuj, w jakich okolicznościach zgubiłeś/aś telefon\n• opisz, co zrobiłeś/aś, aby go odzyskać\n• napisz, jak zareagowali Twoi rodzice\n• poproś kolegę o radę, gdzie kupić nowy telefon w dobrej cenie.',
            writingTask: {
              id: 'exam-w-2',
              type: 'email_informal',
              title: 'Zadanie 12',
              instruction: `Podczas wakacji w Wielkiej Brytanii zgubiłeś/aś telefon. W e-mailu do kolegi z Londynu:
• poinformuj, w jakich okolicznościach zgubiłeś/aś telefon
• opisz, co zrobiłeś/aś, aby go odzyskać
• napisz, jak zareagowali Twoi rodzice\n• poproś kolegę o radę, gdzie kupić nowy telefon w dobrej cenie.`
            }
          }
        ]
      }
    ]
  }
];
