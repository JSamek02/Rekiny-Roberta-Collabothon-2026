export const LessonCategoryGridSkeleton = () => (
  <>
    {[0, 1, 2, 3].map((index) => (
      <article
        key={index}
        aria-hidden
        className="flex h-[100px] animate-pulse flex-col justify-between rounded-xl border border-blue-100 bg-white p-2.5"
      >
        <div className="flex items-center gap-2">
          <div className="size-11 shrink-0 rounded-lg bg-grey-200" />
          <div className="h-3 w-20 rounded bg-grey-200" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <div className="h-2.5 w-12 rounded bg-grey-200" />
            <div className="h-2.5 w-8 rounded bg-grey-200" />
          </div>
          <div className="h-1.5 rounded-full bg-grey-200" />
        </div>
      </article>
    ))}
  </>
);
