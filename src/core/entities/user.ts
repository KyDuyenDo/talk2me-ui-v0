export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'free' | 'pro' | 'admin';
  createdAt?: string;
  streakDays: number;
  savedCourseIds?: string[];
  completedLessonCount?: number;
  targetGoal?: string;
  currentLevel?: string;
  totalStudyMinutes?: number;
  completedLessonsCount?: number;
  joinedDate?: string;
  subscriptionTier?: string;
}

export interface UserProgressStats {
  streakDays: number;
  weeklyMinutes: number;
  totalLessonsCompleted: number;
  averageAccuracy: number;
  cardsMastered: number;
  totalCardsToReview: number;
}
