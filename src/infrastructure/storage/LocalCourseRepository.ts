import { Course } from '../../core/entities';
import { ICourseRepository } from '../../core/repositories/ICourseRepository';
import { INITIAL_COURSES } from '../data/mockCourses';

const COURSES_KEY = 't2m_courses';

export class LocalCourseRepository implements ICourseRepository {
  getCourses(): Course[] {
    try {
      const saved = localStorage.getItem(COURSES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  }

  saveCourses(courses: Course[]): void {
    try {
      localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
    } catch (e) {
      console.error('Failed to save courses', e);
    }
  }
}
