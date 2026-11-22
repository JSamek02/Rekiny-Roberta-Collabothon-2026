export const XP_PER_LEVEL = 40;

export const getExperienceProgress = (experiencePoints: number) => {
  const experience = Math.max(0, experiencePoints);
  const level = Math.floor(experience / XP_PER_LEVEL) + 1;
  const levelExperience = experience % XP_PER_LEVEL;

  return {
    experience,
    level,
    levelExperience,
    nextLevelExperience: level * XP_PER_LEVEL,
    progress: (levelExperience / XP_PER_LEVEL) * 100,
  };
};
