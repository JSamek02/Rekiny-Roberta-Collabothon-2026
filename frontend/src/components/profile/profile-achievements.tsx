import Image from 'next/image';

const achievements = [1, 2, 3] as const;

export const ProfileAchievements = () => (
  <div className="mt-4 grid grid-cols-3 gap-3" aria-label="Achievements">
    {achievements.map((achievement) => (
      <div key={achievement} className="flex aspect-square items-center justify-center rounded-xl">
        <Image
          src={`/img/achievements/achievement-${achievement}.svg`}
          alt={`Achievement ${achievement}`}
          width={120}
          height={160}
          className="h-[85%] w-[85%] object-contain"
        />
      </div>
    ))}
  </div>
);
