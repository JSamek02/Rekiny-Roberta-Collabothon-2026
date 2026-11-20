import React from 'react';

export const LevelBar = () => {
  return (
    <section>
      <div className="h-11 flex justify-end relative isolate">
        <div className="bg-grey-200 rounded-full flex h-3 w-[calc(100%-2.75rem+0.75rem)] absolute left-0 top-1/2 -translate-y-1/2 -z-10">
          <div className="bg-blue-500 w-1/2 h-full rounded-full" />
        </div>
        <div className="size-11 rounded-full border-2 border-blue-500 bg-white text-blue-950 font-semibold flex items-center justify-center">
          6
        </div>
      </div>
      <div className="flex justify-between w-[calc(100%-2.75rem)] -mt-2 text-grey-400">
        <p>8,230</p>
        <p>Next level 10,000</p>
      </div>
    </section>
  );
};
