export type ActivityType = 'article' | 'quiz' | 'video' | 'guided_flow';
export type ActivityProgressStatus = 'not_started' | 'started' | 'completed';

export type ContentImage = {
  url: string;
  alt?: string;
  caption?: string;
};

export type ActivityProgress = {
  status: 'started' | 'completed';
  quiz_score: number | null;
  passed: boolean;
  attempts_count: number;
  xp_earned: number;
  coins_earned: number;
  completed_at: string | null;
};

export type ArticleContent = {
  markdown?: string;
  reading_time_minutes?: number;
  image?: ContentImage;
};

export type QuizOption = {
  id: string;
  text: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  image?: ContentImage;
};

export type QuizContent = {
  questions: QuizQuestion[];
  passing_score_percentage?: number;
};

export type VideoContent = {
  description?: string;
  duration_seconds?: number;
  video_url?: string;
  video_filename?: string;
  video_mime_type?: string;
  video_size_bytes?: number;
  video_language?: string;
};

export type GuidedFlowCanvas = {
  width: number;
  height: number;
};

export type GuidedFlowArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type GuidedFlowInputOption = {
  value: string;
  label: string;
};

export type GuidedFlowInput = GuidedFlowArea & {
  id: string;
  label: string;
  placeholder?: string;
  input_mode?: 'decimal' | 'text';
  accepted_values?: string[];
  options?: GuidedFlowInputOption[];
};

export type GuidedFlowFrame = {
  id: string;
  image_url: string;
  alt: string;
  quest: string;
  hint: string;
  hitbox: GuidedFlowArea & {
    label: string;
  };
  inputs?: GuidedFlowInput[];
};

export type GuidedFlowContent = {
  canvas: GuidedFlowCanvas;
  intro: {
    title: string;
    description: string;
    start_label: string;
  };
  frames: GuidedFlowFrame[];
  back_label: string;
  incomplete_inputs_message: string;
  completion: {
    title: string;
    description: string;
  };
};

type ActivityBase = {
  id: number;
  lesson_id: number;
  title: string;
  activity_type: ActivityType;
  order_index: number;
  xp_reward: number;
  coin_reward: number;
  estimated_minutes: number;
  user_progress?: ActivityProgress | null;
};

export type ArticleActivity = ActivityBase & {
  activity_type: 'article';
  content: ArticleContent;
};

export type QuizActivity = ActivityBase & {
  activity_type: 'quiz';
  content: QuizContent;
};

export type VideoActivity = ActivityBase & {
  activity_type: 'video';
  content: VideoContent;
};

export type GuidedFlowActivity = ActivityBase & {
  activity_type: 'guided_flow';
  content: GuidedFlowContent;
};

export type LearningActivity = ArticleActivity | QuizActivity | VideoActivity | GuidedFlowActivity;

export type ActivitySummary = {
  id: number;
  lesson_id: number;
  title: string;
  activity_type: ActivityType;
  order_index: number;
  xp_reward: number;
  coin_reward: number;
  estimated_minutes: number;
  is_completed: boolean;
  progress_status?: ActivityProgressStatus;
};

export type LessonActivities = {
  id: number;
  title: string;
  order_index: number;
  activities: ActivitySummary[];
};

export type RoadmapCourse = {
  id: number;
  slug: string;
  lessons: LessonActivities[];
};

export type RoadmapCourseResponse = {
  course: RoadmapCourse;
};

export type LearningActivityResponse = {
  activity: LearningActivity;
};

export type CompleteActivityResponse = {
  status: 'ok';
  activity_id: number;
  xp_earned: number;
  coins_earned: number;
  shark_coins?: number;
  experience_points?: number;
  is_first_completion: boolean;
  lesson_completed: boolean;
  course_completed: boolean;
  persisted: boolean;
};

export type QuizReview = {
  question_id: string;
  prompt: string;
  submitted_option: string | null;
  correct_option: string;
  is_correct: boolean;
  explanation?: string;
};

export type SubmitQuizResponse = CompleteActivityResponse & {
  passed: boolean;
  score: number;
  passing_score: number;
  correct_count: number;
  total_questions: number;
  review: QuizReview[];
};

export type SubmitLearningQuizParams = {
  activityId: number;
  answers: Record<string, string>;
};
