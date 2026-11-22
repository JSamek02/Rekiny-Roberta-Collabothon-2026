'use client';

import { createContext, useContext, useState, useSyncExternalStore } from 'react';
import type { AvatarHat } from '@/components/avatar';

type ShopContextValue = {
  boughtHats: AvatarHat[];
  buyHat: (hat: AvatarHat) => void;
  starredCourses: string[];
  starredCoursesHydrated: boolean;
  toggleStarredCourse: (course: string) => void;
};

const ShopContext = createContext<ShopContextValue | null>(null);
const STARRED_COURSES_STORAGE_KEY = 'starred-courses';
const DEFAULT_STARRED_COURSES = ['stocks-bonds', 'investing', 'budgeting', 'economics'];
const STARRED_COURSES_EVENT = 'starred-courses-change';

const subscribeStarredCourses = (callback: () => void) => {
  window.addEventListener(STARRED_COURSES_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(STARRED_COURSES_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};

const getStarredCoursesSnapshot = () =>
  window.localStorage.getItem(STARRED_COURSES_STORAGE_KEY) ??
  JSON.stringify(DEFAULT_STARRED_COURSES);

const getStarredCoursesServerSnapshot = () => JSON.stringify(DEFAULT_STARRED_COURSES);

const subscribeHydration = () => () => {};
const getHydrationSnapshot = () => true;
const getHydrationServerSnapshot = () => false;

const parseStarredCourses = (snapshot: string) => {
  try {
    const parsed = JSON.parse(snapshot);
    return Array.isArray(parsed) ? (parsed as string[]) : DEFAULT_STARRED_COURSES;
  } catch {
    return DEFAULT_STARRED_COURSES;
  }
};

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [boughtHats, setBoughtHats] = useState<AvatarHat[]>([1, 2, 3]);
  const starredCoursesSnapshot = useSyncExternalStore(
    subscribeStarredCourses,
    getStarredCoursesSnapshot,
    getStarredCoursesServerSnapshot,
  );
  const starredCoursesHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getHydrationServerSnapshot,
  );

  const starredCourses = parseStarredCourses(starredCoursesSnapshot);

  const buyHat = (hat: AvatarHat) => {
    setBoughtHats((current) => (current.includes(hat) ? current : [...current, hat].sort()));
  };

  const toggleStarredCourse = (course: string) => {
    const next = starredCourses.includes(course)
      ? starredCourses.filter((key) => key !== course)
      : [...starredCourses, course];
    window.localStorage.setItem(STARRED_COURSES_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(STARRED_COURSES_EVENT));
  };

  return (
    <ShopContext.Provider
      value={{ boughtHats, buyHat, starredCourses, starredCoursesHydrated, toggleStarredCourse }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used within ShopProvider');
  return context;
};
