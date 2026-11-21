'use client';

import { QuizContent, SubmitQuizResponse } from '@/api/types/learning';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ContentImage } from './content-image';

type QuizActivityProps = {
  content: QuizContent;
  isSubmitting: boolean;
  result: SubmitQuizResponse | null;
  onSubmit: (answers: Record<string, string>) => void;
  onRetry: () => void;
};

export const QuizActivity = ({ content, isSubmitting, result, onSubmit, onRetry }: QuizActivityProps) => {
  const t = useTranslations('components.learning-activity');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = content.questions || [];
  const allAnswered = questions.length > 0 && questions.every((question) => answers[question.id]);

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, index) => {
        const review = result?.review.find((item) => item.question_id === question.id);

        return (
          <fieldset key={question.id} className="rounded-2xl border border-blue-100 bg-white p-4">
            <legend className="px-1 text-xs font-semibold text-blue-500">
              {t('question-number', { current: index + 1, total: questions.length })}
            </legend>
            <p className="mt-2 text-base font-semibold leading-relaxed text-blue-950">{question.prompt}</p>
            {question.image && <ContentImage image={question.image} className="mt-4" />}
            <div className="mt-4 flex flex-col gap-2">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                const isCorrect = review?.correct_option === option.id;
                const isWrongSelection = review?.submitted_option === option.id && !review.is_correct;

                return (
                  <label
                    key={option.id}
                    className={[
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors',
                      isCorrect ? 'border-green-500 bg-green-50 text-green-800' : '',
                      isWrongSelection ? 'border-red-300 bg-red-50 text-red-800' : '',
                      !review && isSelected ? 'border-blue-500 bg-blue-50 text-blue-950' : '',
                      !review && !isSelected ? 'border-blue-100 text-grey-600 hover:border-blue-500' : '',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={option.id}
                      checked={isSelected}
                      disabled={isSubmitting || Boolean(result)}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                      className="size-4 accent-blue-500"
                    />
                    <span>{option.text}</span>
                  </label>
                );
              })}
            </div>
            {review?.explanation && <p className="mt-3 text-xs leading-5 text-grey-600">{review.explanation}</p>}
          </fieldset>
        );
      })}

      {result ? (
        <div className={`rounded-2xl border p-4 ${result.passed ? 'border-green-500 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
          <p className="font-semibold text-blue-950">
            {result.passed ? t('quiz-passed') : t('quiz-not-passed')}
          </p>
          <p className="mt-1 text-sm text-grey-600">
            {t('quiz-score', { correct: result.correct_count, total: result.total_questions, score: result.score })}
          </p>
          {!result.passed && (
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                onRetry();
              }}
              className="mt-3 text-sm font-semibold text-blue-500 hover:text-blue-950"
            >
              {t('try-again')}
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={!allAnswered || isSubmitting}
          onClick={() => onSubmit(answers)}
          className="w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? t('checking') : t('check-quiz')}
        </button>
      )}
    </div>
  );
};
