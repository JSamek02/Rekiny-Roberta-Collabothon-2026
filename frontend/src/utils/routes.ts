export const routes = {
  home: '/',
  ranking: '/ranking',
  learning: '/learning',
  learningCategory: (category: string) => `/learning/${category}`,
  learningLesson: (category: string, lesson: string) => `/learning/${category}/${lesson}`,
  stock: '/stock',
  profile: '/profile',
  settings: '/profile/settings',
  shop: '/shop',
  startingQuiz: '/starting-quiz',
  chat: '/chat',
  login: '/login',
} as const;
