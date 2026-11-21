export type LessonStatus = 'completed' | 'in-progress' | 'not-started';

export type LessonListItem = {
  slug: string;
  title: string;
  status: LessonStatus;
};
