import { GrammarSection } from '../types';

export const GRAMMAR_SECTIONS: GrammarSection[] = [
  {
    id: 'translations',
    title: 'Tłumaczenie Fragmentów',
    description: 'Przetłumacz na język angielski fragmenty podane w nawiasach. To najczęściej punktowane zadanie otwarte na maturze.',
    tasks: [
      {
        id: 'trans-set-1',
        type: 'translation',
        instruction: 'Zestaw 1: Czasy i Czasowniki (1-10)',
        questions: [
          { id: 1, prefix: 'I promise I', text: '(posprzątam)', suffix: 'my room tomorrow.', correctAnswer: ['will clean', "'ll clean"] },
          { id: 2, prefix: 'We', text: '(nie widzieliśmy)', suffix: 'Alice since last Monday.', correctAnswer: ['haven\'t seen', 'have not seen'] },
          { id: 3, prefix: 'While I was reading a book, my phone', text: '(zadzwonił)', suffix: '.', correctAnswer: ['rang'] },
          { id: 4, prefix: 'Look at those clouds! It', text: '(będzie padać)', suffix: 'soon.', correctAnswer: ['is going to rain', "'s going to rain"] },
          { id: 5, prefix: 'I', text: '(zwykłem grać)', suffix: 'football when I was younger.', correctAnswer: ['used to play'] },
          { id: 6, prefix: 'This house', text: '(został zbudowany)', suffix: 'in 1990.', correctAnswer: ['was built'] },
          { id: 7, prefix: 'What', text: '(robisz)', suffix: 'now? I am watching TV.', correctAnswer: ['are you doing'] },
          { id: 8, prefix: 'If I were you, I', text: '(kupiłbym)', suffix: 'this car.', correctAnswer: ['would buy', "'d buy"] },
          { id: 9, prefix: 'She asked me where', text: '(mieszkam)', suffix: '.', correctAnswer: ['I lived'] },
          { id: 10, prefix: 'I will call you as soon as I', text: '(wrócę)', suffix: 'home.', correctAnswer: ['come', 'get', 'return'] }
        ]
      },
      {
        id: 'trans-set-2',
        type: 'translation',
        instruction: 'Zestaw 2: Gramatyka i Słownictwo (1-10)',
        questions: [
          { id: 1, prefix: 'They', text: '(oglądali)', suffix: 'TV at 5 PM yesterday.', correctAnswer: ['were watching'] },
          { id: 2, prefix: 'Have you', text: '(kiedykolwiek byłeś)', suffix: 'to London?', correctAnswer: ['ever been'] },
          { id: 3, prefix: 'I', text: '(muszę)', suffix: 'go now, it is late.', correctAnswer: ['must', 'have to'] },
          { id: 4, prefix: 'He is', text: '(zainteresowany)', suffix: 'history.', correctAnswer: ['interested in'] },
          { id: 5, prefix: 'How long', text: '(znasz)', suffix: 'your best friend?', correctAnswer: ['have you known'] },
          { id: 6, prefix: 'This soup', text: '(smakuje)', suffix: 'delicious.', correctAnswer: ['tastes'] },
          { id: 7, prefix: 'I would like', text: '(żebyś przyszedł)', suffix: 'to my party.', correctAnswer: ['you to come'] },
          { id: 8, prefix: 'Please stop', text: '(rozmawiać)', suffix: '.', correctAnswer: ['talking'] },
          { id: 9, prefix: 'My sister is', text: '(dobra w)', suffix: 'maths.', correctAnswer: ['good at'] },
          { id: 10, prefix: 'This is', text: '(najlepszy)', suffix: 'film I have ever seen.', correctAnswer: ['the best'] }
        ]
      }
    ]
  },
  {
    id: 'minidialogues',
    title: 'Mini-dialogi (Wybór)',
    description: 'Typowe zadanie maturalne. Wybierz odpowiednią reakcję językową do podanej sytuacji.',
    tasks: [
      {
        id: 'dial-1',
        type: 'choice',
        instruction: 'Zestaw 1: Sytuacje codzienne (1-10)',
        questions: [
          {
            id: 1,
            text: 'X: I have a terrible headache.\nY: __________',
            options: ['A. You should see a doctor.', 'B. I don\'t agree with you.', 'C. It doesn\'t matter.'],
            correctAnswer: 'A. You should see a doctor.'
          },
          {
            id: 2,
            text: 'X: Could you pass me the salt, please?\nY: __________',
            options: ['A. Yes, I would.', 'B. Here you are.', 'C. Help yourself.'],
            correctAnswer: 'B. Here you are.'
          },
          {
            id: 3,
            text: 'X: How long does it take to get to the station?\nY: __________',
            options: ['A. About two kilometers.', 'B. By bus.', 'C. Ten minutes.'],
            correctAnswer: 'C. Ten minutes.'
          },
          {
            id: 4,
            text: 'X: I passed my driving test!\nY: __________',
            options: ['A. Good luck!', 'B. Congratulations!', 'C. Cheer up!'],
            correctAnswer: 'B. Congratulations!'
          },
          {
            id: 5,
            text: 'X: Would you like to go to the cinema tonight?\nY: __________',
            options: ['A. Yes, I like.', 'B. I\'m afraid I can\'t.', 'C. It\'s a pity.'],
            correctAnswer: 'B. I\'m afraid I can\'t.'
          },
          {
            id: 6,
            text: 'X: Can I try this shirt on?\nY: __________',
            options: ['A. Yes, the changing rooms are over there.', 'B. Yes, you fit it.', 'C. No, I don\'t wear it.'],
            correctAnswer: 'A. Yes, the changing rooms are over there.'
          },
          {
            id: 7,
            text: 'X: Excuse me, how do I get to the museum?\nY: __________',
            options: ['A. You can\'t miss it.', 'B. Go straight on and turn left.', 'C. It opens at 9 AM.'],
            correctAnswer: 'B. Go straight on and turn left.'
          },
          {
            id: 8,
            text: 'X: I am so sorry I broke your cup.\nY: __________',
            options: ['A. No problem, accidents happen.', 'B. You are welcome.', 'C. Same to you.'],
            correctAnswer: 'A. No problem, accidents happen.'
          },
          {
            id: 9,
            text: 'X: Do you mind if I open the window?\nY: __________',
            options: ['A. Yes, please do.', 'B. No, not at all. Go ahead.', 'C. Yes, I open it.'],
            correctAnswer: 'B. No, not at all. Go ahead.'
          },
          {
            id: 10,
            text: 'X: Thank you for your help.\nY: __________',
            options: ['A. Never mind.', 'B. You\'re welcome.', 'C. I think so.'],
            correctAnswer: 'B. You\'re welcome.'
          }
        ]
      },
      {
        id: 'dial-2',
        type: 'choice',
        instruction: 'Zestaw 2: Reakcje językowe (1-10)',
        questions: [
          {
            id: 1,
            text: 'X: What does your new boyfriend look like?\nY: __________',
            options: ['A. He likes football.', 'B. He is tall and handsome.', 'C. He is very intelligent.'],
            correctAnswer: 'B. He is tall and handsome.'
          },
          {
            id: 2,
            text: 'X: How about going for a pizza?\nY: __________',
            options: ['A. That sounds like a great idea.', 'B. I don\'t think so.', 'C. Yes, I am hungry.'],
            correctAnswer: 'A. That sounds like a great idea.'
          },
          {
            id: 3,
            text: 'X: Can I help you?\nY: __________',
            options: ['A. I am looking for a jacket.', 'B. Yes, I help you.', 'C. No, I don\'t want.'],
            correctAnswer: 'A. I am looking for a jacket.'
          },
          {
            id: 4,
            text: 'X: Bless you!\nY: __________',
            options: ['A. Thank you.', 'B. You too.', 'C. Fine, thanks.'],
            correctAnswer: 'A. Thank you.'
          },
          {
            id: 5,
            text: 'X: It was nice talking to you.\nY: __________',
            options: ['A. Me too.', 'B. Same here. Bye!', 'C. I agree.'],
            correctAnswer: 'B. Same here. Bye!'
          },
          {
            id: 6,
            text: 'X: Why don\'t we watch a movie?\nY: __________',
            options: ['A. Yes, let\'s do that.', 'B. Because I like it.', 'C. No, I don\'t.'],
            correctAnswer: 'A. Yes, let\'s do that.'
          },
          {
            id: 7,
            text: 'X: What is your sister like?\nY: __________',
            options: ['A. She likes music.', 'B. She is friendly and helpful.', 'C. She is watching TV.'],
            correctAnswer: 'B. She is friendly and helpful.'
          },
          {
            id: 8,
            text: 'X: Whose phone is this?\nY: __________',
            options: ['A. It\'s mine.', 'B. It\'s me.', 'C. It\'s my.'],
            correctAnswer: 'A. It\'s mine.'
          },
          {
            id: 9,
            text: 'X: Have a nice trip!\nY: __________',
            options: ['A. You\'re welcome.', 'B. Thank you.', 'C. Not at all.'],
            correctAnswer: 'B. Thank you.'
          },
          {
            id: 10,
            text: 'X: I\'m hungry.\nY: __________',
            options: ['A. Have a sandwich.', 'B. Drink some water.', 'C. Go to sleep.'],
            correctAnswer: 'A. Have a sandwich.'
          }
        ]
      }
    ]
  },
  {
    id: 'abc_grammar',
    title: 'Środki Językowe (Wybór ABC)',
    description: 'Uzupełnij zdania, wybierając poprawną odpowiedź. Zadanie sprawdza znajomość gramatyki i słownictwa.',
    tasks: [
      {
        id: 'abc-1',
        type: 'choice',
        instruction: 'Zestaw 1: Gramatyka podstawowa (1-10)',
        questions: [
          { id: 1, text: 'I have lived here _____ 2010.', options: ['A. since', 'B. for', 'C. from'], correctAnswer: 'A. since' },
          { id: 2, text: 'If it rains, we _____ go to the park.', options: ['A. don\'t', 'B. won\'t', 'C. wouldn\'t'], correctAnswer: 'B. won\'t' },
          { id: 3, text: 'This book is _____ than that one.', options: ['A. interesting', 'B. more interesting', 'C. most interesting'], correctAnswer: 'B. more interesting' },
          { id: 4, text: 'He _____ go to school yesterday.', options: ['A. didn\'t', 'B. doesn\'t', 'C. wasn\'t'], correctAnswer: 'A. didn\'t' },
          { id: 5, text: 'We enjoy _____ films.', options: ['A. watch', 'B. to watch', 'C. watching'], correctAnswer: 'C. watching' },
          { id: 6, text: 'There isn\'t _____ bread left.', options: ['A. some', 'B. any', 'C. no'], correctAnswer: 'B. any' },
          { id: 7, text: 'Where _____ you born?', options: ['A. did', 'B. were', 'C. was'], correctAnswer: 'B. were' },
          { id: 8, text: 'You _____ smoke in the hospital. It is forbidden.', options: ['A. mustn\'t', 'B. don\'t have to', 'C. shouldn\'t'], correctAnswer: 'A. mustn\'t' },
          { id: 9, text: 'This is the boy _____ father is a doctor.', options: ['A. who', 'B. whose', 'C. which'], correctAnswer: 'B. whose' },
          { id: 10, text: 'I am not interested _____ football.', options: ['A. on', 'B. in', 'C. at'], correctAnswer: 'B. in' }
        ]
      },
      {
        id: 'abc-2',
        type: 'choice',
        instruction: 'Zestaw 2: Gramatyka i przyimki (1-10)',
        questions: [
          { id: 1, text: 'She is good _____ singing.', options: ['A. at', 'B. on', 'C. in'], correctAnswer: 'A. at' },
          { id: 2, text: 'My room is _____ than yours.', options: ['A. big', 'B. bigger', 'C. more big'], correctAnswer: 'B. bigger' },
          { id: 3, text: 'When I came home, mum _____ dinner.', options: ['A. cooked', 'B. was cooking', 'C. is cooking'], correctAnswer: 'B. was cooking' },
          { id: 4, text: 'I have _____ been to Paris.', options: ['A. never', 'B. ever', 'C. yet'], correctAnswer: 'A. never' },
          { id: 5, text: 'Lets go _____ a walk.', options: ['A. for', 'B. on', 'C. to'], correctAnswer: 'A. for' },
          { id: 6, text: 'How _____ apples do we need?', options: ['A. much', 'B. many', 'C. any'], correctAnswer: 'B. many' },
          { id: 7, text: 'He is _____ person I know.', options: ['A. funny', 'B. funnier', 'C. the funniest'], correctAnswer: 'C. the funniest' },
          { id: 8, text: 'I usually _____ up at 7 AM.', options: ['A. get', 'B. am getting', 'C. got'], correctAnswer: 'A. get' },
          { id: 9, text: 'Did you _____ the film?', options: ['A. liked', 'B. like', 'C. likes'], correctAnswer: 'B. like' },
          { id: 10, text: 'Look! The bus _____ .', options: ['A. comes', 'B. is coming', 'C. came'], correctAnswer: 'B. is coming' }
        ]
      }
    ]
  },
  {
    id: 'double_meaning',
    title: 'Wieloznaczność (Słownictwo)',
    description: 'Wybierz jedno słowo, które poprawnie uzupełnia oba zdania.',
    tasks: [
      {
        id: 'double-1',
        type: 'choice',
        instruction: 'Zestaw 1: Słowa wieloznaczne (1-10)',
        questions: [
          {
            id: 1,
            text: '1. I need to _____ a table for two at the restaurant.\n2. I read a very interesting _____ yesterday.',
            options: ['A. reserve', 'B. book', 'C. novel'],
            correctAnswer: 'B. book'
          },
          {
            id: 2,
            text: '1. Can you _____ on the light, please?\n2. It is your _____ to roll the dice.',
            options: ['A. switch', 'B. turn', 'C. move'],
            correctAnswer: 'B. turn'
          },
          {
            id: 3,
            text: '1. We live in a small _____ in the city centre.\n2. The countryside is very _____ here, there are no hills.',
            options: ['A. apartment', 'B. level', 'C. flat'],
            correctAnswer: 'C. flat'
          },
          {
            id: 4,
            text: '1. He is a very _____ person, he always helps others.\n2. What _____ of music do you like?',
            options: ['A. kind', 'B. type', 'C. nice'],
            correctAnswer: 'A. kind'
          },
          {
            id: 5,
            text: '1. I wear a gold _____ on my finger.\n2. I will _____ you later tonight.',
            options: ['A. call', 'B. ring', 'C. band'],
            correctAnswer: 'B. ring'
          },
          {
            id: 6,
            text: '1. We often _____ football on Sundays.\n2. We saw a great _____ at the theatre.',
            options: ['A. game', 'B. play', 'C. match'],
            correctAnswer: 'B. play'
          },
          {
            id: 7,
            text: '1. Can I pay by _____ transfer?\n2. We sat on the _____ of the river.',
            options: ['A. bank', 'B. shore', 'C. card'],
            correctAnswer: 'A. bank'
          },
          {
            id: 8,
            text: '1. This box is very _____, I can lift it easily.\n2. Please turn off the _____ before you leave.',
            options: ['A. light', 'B. lamp', 'C. heavy'],
            correctAnswer: 'A. light'
          },
          {
            id: 9,
            text: '1. I usually _____ TV in the evening.\n2. My _____ is five minutes fast.',
            options: ['A. look', 'B. see', 'C. watch'],
            correctAnswer: 'C. watch'
          },
          {
            id: 10,
            text: '1. Let\'s go for a walk in the _____.\n2. You can\'t _____ your car here.',
            options: ['A. garden', 'B. park', 'C. stop'],
            correctAnswer: 'B. park'
          }
        ]
      },
      {
        id: 'double-2',
        type: 'choice',
        instruction: 'Zestaw 2: Słowa wieloznaczne (1-10)',
        questions: [
          {
            id: 1,
            text: '1. She has long, dark _____.\n2. There is a _____ in my soup!',
            options: ['A. hair', 'B. fur', 'C. hairs'],
            correctAnswer: 'A. hair'
          },
          {
            id: 2,
            text: '1. It\'s not _____ that he gets more money than me.\n2. She has long _____ hair.',
            options: ['A. right', 'B. fair', 'C. blond'],
            correctAnswer: 'B. fair'
          },
          {
            id: 3,
            text: '1. I don\'t have enough _____ for this table.\n2. Go to your _____ and do your homework.',
            options: ['A. space', 'B. place', 'C. room'],
            correctAnswer: 'C. room'
          },
          {
            id: 4,
            text: '1. The train leaves from platform 4.\n2. She _____ home at 8 AM.',
            options: ['A. goes', 'B. leaves', 'C. exits'],
            correctAnswer: 'B. leaves'
          },
          {
            id: 5,
            text: '1. I am a big _____ of this band.\n2. It is hot, please turn on the _____.',
            options: ['A. fan', 'B. air', 'C. member'],
            correctAnswer: 'A. fan'
          },
          {
            id: 6,
            text: '1. This shirt doesn\'t _____ your trousers.\n2. He struck a _____ to light the fire.',
            options: ['A. fit', 'B. suit', 'C. match'],
            correctAnswer: 'C. match'
          },
          {
            id: 7,
            text: '1. I got a parking _____ yesterday.\n2. The weather is _____ today.',
            options: ['A. fine', 'B. ticket', 'C. good'],
            correctAnswer: 'A. fine'
          },
          {
            id: 8,
            text: '1. He hit the ball with a baseball _____.\n2. A _____ flies at night.',
            options: ['A. stick', 'B. bat', 'C. club'],
            correctAnswer: 'B. bat'
          },
          {
            id: 9,
            text: '1. _____ is my favourite season.\n2. The mattress has a broken _____.',
            options: ['A. Summer', 'B. Spring', 'C. Autumn'],
            correctAnswer: 'B. Spring'
          },
          {
            id: 10,
            text: '1. The dog started to _____ loudly.\n2. The tree has rough _____.',
            options: ['A. bark', 'B. shout', 'C. skin'],
            correctAnswer: 'A. bark'
          }
        ]
      }
    ]
  },
  {
    id: 'paraphrase',
    title: 'Parafrazy (Transformacje)',
    description: 'Wybierz zdanie, które ma takie samo znaczenie jak zdanie wyjściowe.',
    tasks: [
      {
        id: 'para-1',
        type: 'choice',
        instruction: 'Zestaw 1: Transformacje (1-10)',
        questions: [
          {
            id: 1,
            text: 'It is not necessary for you to help me.',
            options: ['A. You mustn\'t help me.', 'B. You don\'t have to help me.', 'C. You can\'t help me.'],
            correctAnswer: 'B. You don\'t have to help me.'
          },
          {
            id: 2,
            text: 'The film was so boring that I fell asleep.',
            options: ['A. It was such a boring film.', 'B. The film was too boring.', 'C. It was a very boring film.'],
            correctAnswer: 'A. It was such a boring film.'
          },
          {
            id: 3,
            text: 'I started learning English 5 years ago.',
            options: ['A. I learn English for 5 years.', 'B. I have been learning English for 5 years.', 'C. I was learning English 5 years ago.'],
            correctAnswer: 'B. I have been learning English for 5 years.'
          },
          {
            id: 4,
            text: 'They sell fresh bread here.',
            options: ['A. Fresh bread is sold here.', 'B. Fresh bread sells here.', 'C. Fresh bread has been sold here.'],
            correctAnswer: 'A. Fresh bread is sold here.'
          },
          {
            id: 5,
            text: 'I advised him to see a doctor.',
            options: ['A. If I were you, I would see a doctor.', 'B. You must see a doctor.', 'C. I want you to see a doctor.'],
            correctAnswer: 'A. If I were you, I would see a doctor.'
          },
          {
            id: 6,
            text: 'Unless you hurry, you will miss the bus.',
            options: ['A. If you hurry, you will miss the bus.', 'B. If you don\'t hurry, you will miss the bus.', 'C. If you won\'t hurry, you will miss the bus.'],
            correctAnswer: 'B. If you don\'t hurry, you will miss the bus.'
          },
          {
            id: 7,
            text: 'There are no eggs in the fridge.',
            options: ['A. There aren\'t any eggs in the fridge.', 'B. There isn\'t any eggs in the fridge.', 'C. There aren\'t some eggs in the fridge.'],
            correctAnswer: 'A. There aren\'t any eggs in the fridge.'
          },
          {
            id: 8,
            text: 'This car is too expensive for me.',
            options: ['A. This car isn\'t cheap enough for me.', 'B. This car is very expensive.', 'C. I have enough money for this car.'],
            correctAnswer: 'A. This car isn\'t cheap enough for me.'
          },
          {
            id: 9,
            text: 'When did you buy this phone?',
            options: ['A. How long do you have this phone?', 'B. How long have you had this phone?', 'C. When have you bought this phone?'],
            correctAnswer: 'B. How long have you had this phone?'
          },
          {
            id: 10,
            text: 'Let\'s go to the cinema.',
            options: ['A. How about going to the cinema?', 'B. Do we go to the cinema?', 'C. I want to go to the cinema.'],
            correctAnswer: 'A. How about going to the cinema?'
          }
        ]
      },
      {
        id: 'para-2',
        type: 'choice',
        instruction: 'Zestaw 2: Transformacje (1-10)',
        questions: [
          {
            id: 1,
            text: 'I last saw him in May.',
            options: ['A. I didn\'t see him since May.', 'B. I haven\'t seen him since May.', 'C. I haven\'t seen him in May.'],
            correctAnswer: 'B. I haven\'t seen him since May.'
          },
          {
            id: 2,
            text: 'Can you swim?',
            options: ['A. Are you able to swim?', 'B. Do you must swim?', 'C. Should you swim?'],
            correctAnswer: 'A. Are you able to swim?'
          },
          {
            id: 3,
            text: 'Eating in class is forbidden.',
            options: ['A. You don\'t have to eat in class.', 'B. You mustn\'t eat in class.', 'C. You shouldn\'t eat in class.'],
            correctAnswer: 'B. You mustn\'t eat in class.'
          },
          {
            id: 4,
            text: 'My room is smaller than yours.',
            options: ['A. Your room is smaller than mine.', 'B. Your room is as big as mine.', 'C. Your room is bigger than mine.'],
            correctAnswer: 'C. Your room is bigger than mine.'
          },
          {
            id: 5,
            text: 'I am not interested in sports.',
            options: ['A. Sports are not interesting for me.', 'B. I don\'t like sports.', 'C. Both A and B.'],
            correctAnswer: 'C. Both A and B.'
          },
          {
            id: 6,
            text: 'He drives very dangerously.',
            options: ['A. He is a dangerous driver.', 'B. He drives dangerous.', 'C. His driving is danger.'],
            correctAnswer: 'A. He is a dangerous driver.'
          },
          {
            id: 7,
            text: 'I regret selling my bike.',
            options: ['A. I wish I hadn\'t sold my bike.', 'B. I want to sell my bike.', 'C. I sold my bike.'],
            correctAnswer: 'A. I wish I hadn\'t sold my bike.'
          },
          {
            id: 8,
            text: 'Could you open the door?',
            options: ['A. Do you mind opening the door?', 'B. Do you want to open the door?', 'C. You can open the door.'],
            correctAnswer: 'A. Do you mind opening the door?'
          },
          {
            id: 9,
            text: 'Nobody in our class is as tall as Mark.',
            options: ['A. Mark is taller than anyone in our class.', 'B. Mark is the tallest student in our class.', 'C. Both A and B.'],
            correctAnswer: 'C. Both A and B.'
          },
          {
            id: 10,
            text: 'Where is the station?',
            options: ['A. Could you tell me where the station is?', 'B. Could you tell me where is the station?', 'C. Do you know where is the station?'],
            correctAnswer: 'A. Could you tell me where the station is?'
          }
        ]
      }
    ]
  }
];