import { Course } from '../entities';

export interface ICourseRepository {
  getCourses(): Course[];
  saveCourses(courses: Course[]): void;
}
