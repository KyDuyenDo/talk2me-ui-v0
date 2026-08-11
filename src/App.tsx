import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Course, UserProfile } from './core/entities';
import { INITIAL_CATEGORIES } from './infrastructure/data/mockCourses';
import { 
  AuthProvider, 
  CourseProvider, 
  FlashcardProvider, 
  ThemeProvider,
  useTheme,
  useAuth,
  useCourses
} from './application';
import { QueryProvider } from './application/providers/QueryProvider';
import { useCoursesQuery, useDeleteCourseMutation } from './application/queries/useCoursesQuery';
import { getCourseDetail, getDueFlashcardCount } from './infrastructure/api/talk2meApi';
import { HeaderTopNav, FooterSection, BottomNav } from './presentation/layout';
import { AuthModal, AuthRequirementModal } from './presentation/components/auth';
import { CreateCourseModal } from './presentation/components/course';
import { Toast, PageLoadingSpinner } from './presentation/components/common';
import {
  HomePage,
  CourseDetailPage,
  FlashcardsPage,
  AnalyticsPage,
  CommunityPage,
  SettingsPage,
  AuthPage,
  CoursesPage,
  NotificationsPage
} from './presentation/pages';
function CourseDetailRouteWrapper({
  onOpenCreateModal,
  onDeleteCourse,
}: {
  onOpenCreateModal?: (url?: string) => void;
  onDeleteCourse?: (target: Course | string) => void;
}) {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) {
      // Nothing to load — bounce back instead of a spinner stuck forever.
      navigate('/courses', { replace: true });
      return;
    }
    // Always fetch the FULL detail (with lessons) — the courses-list endpoints only ever
    // return summaries, so short-circuiting with a locally-cached summary here would render
    // a "course" with no lessons.
    setIsLoading(true);
    setCourse(null);
    getCourseDetail(courseId)
      .then((res) => setCourse(res))
      .catch(() => setCourse(null))
      .finally(() => setIsLoading(false));
  }, [courseId, navigate]);

  if (isLoading) {
    return <PageLoadingSpinner message="Đang tải thông tin khóa học..." />;
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-lg font-bold text-[#1B1F2E] dark:text-white font-display">Không tìm thấy khóa học này</p>
        <button
          onClick={() => navigate('/courses')}
          className="px-6 py-2.5 rounded-2xl bg-[#2E68FF] text-white font-bold text-xs shadow-md"
        >
          Quay lại danh sách khóa học
        </button>
      </div>
    );
  }

  return (
    <CourseDetailPage
      course={course}
      onBack={() => navigate(-1)}
      onOpenCreateModal={onOpenCreateModal}
      onDeleteCourse={(id) => {
        Promise.resolve(onDeleteCourse?.(id)).then(() => navigate('/courses'));
      }}
    />
  );
}

function AppContent() {
  const { darkMode, setDarkMode } = useTheme();
  const { user, login, logout } = useAuth();
  const { publicCourses, categories, createCategory } = useCourses();
  const navigate = useNavigate();
  const deleteCourseMutation = useDeleteCourseMutation();

  const [streakCount] = useState<number>(5);
  const [dueCount, setDueCount] = useState<number>(0);

  // Auth requirement modal state
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    featureTitle?: string;
    featureDescription?: string;
    pendingAction?: () => void;
  }>({ isOpen: false });

  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [authRedirectReason, setAuthRedirectReason] = useState<string>('');
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState<boolean>(false);

  // Category/search filters for Home & Courses — read directly from the URL every render
  // (no local useState mirror) so browser back/forward and manual URL edits always reflect
  // immediately, instead of only syncing once on mount.
  const [filterParams, setFilterParams] = useSearchParams();
  const selectedCategory = filterParams.get('cat') || 'all';
  const searchQuery = filterParams.get('q') || '';

  const handleSelectCategory = (cat: string) => {
    setFilterParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === 'all') next.delete('cat');
      else next.set('cat', cat);
      return next;
    }, { replace: true });
  };

  const handleSearchChange = (q: string) => {
    setFilterParams((prev) => {
      const next = new URLSearchParams(prev);
      if (q) next.set('q', q);
      else next.delete('q');
      return next;
    }, { replace: true });
  };

  // Modal create course
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [prefillUrl, setPrefillUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real, server-backed courses
  const { data: myCourses = [], isLoading: isCoursesLoading } = useCoursesQuery(selectedCategory, searchQuery);

  useEffect(() => {
    if (!user) {
      setDueCount(0);
      return;
    }
    getDueFlashcardCount()
      .then((res) => setDueCount(res.count))
      .catch(() => setDueCount(0));
  }, [user]);

  const handleDeleteCourse = async (target: Course | string) => {
    const courseId = typeof target === 'string' ? target : target.id;
    try {
      await deleteCourseMutation.mutateAsync(courseId);
      setToastMessage('Đã xóa khóa học thành công.');
    } catch (err: any) {
      console.error('Failed to delete course:', err);
      setToastMessage(err.message || 'Không thể xóa khóa học.');
    }
  };

  const requireAuth = (
    action: () => void,
    title = 'Tính năng này yêu cầu đăng nhập',
    description = 'Đăng nhập hoặc đăng ký tài khoản Talk2Me để lưu tiến độ học tập, khởi tạo khóa học AI cá nhân và mở khóa đầy đủ quyền lợi.'
  ) => {
    if (user) {
      action();
    } else {
      setAuthModal({
        isOpen: true,
        featureTitle: title,
        featureDescription: description,
        pendingAction: action,
      });
    }
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login', reason?: string) => {
    setAuthInitialMode(mode);
    setAuthRedirectReason(reason || '');
    setIsAuthPopupOpen(true);
  };

  const handleAuthConfirmModal = (mode: 'login' | 'signup') => {
    const reason = authModal.featureTitle || 'Truy cập tính năng phân quyền';
    setAuthModal({ isOpen: false });
    handleOpenAuth(mode, reason);
  };

  const handleLoginSuccess = (newUser: UserProfile) => {
    login(newUser);
    setIsAuthPopupOpen(false);
    if (authModal.pendingAction) {
      const action = authModal.pendingAction;
      setAuthModal({ isOpen: false });
      action();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleOpenCreateModal = (url = '') => {
    requireAuth(
      () => {
        setPrefillUrl(url);
        setIsCreateModalOpen(true);
      },
      'Tạo khóa học AI mới',
      'Đăng nhập tài khoản Talk2Me để hệ thống phân tích video YouTube và sinh ra khóa học cá nhân hóa cho riêng bạn.'
    );
  };

  const handleCourseQueued = () => {
    setIsCreateModalOpen(false);
    navigate('/courses');
    setToastMessage('Đang tạo khoá học... Kết quả sẽ xuất hiện trong Khoá học của bạn.');
  };

  const handleSelectMyCourse = (course: Course) => {
    navigate(`/courses/${course.id}`);
  };

  // Callers (HeaderTopNav/BottomNav/MobileDrawer) already `navigate()` to the tab's route
  // themselves right alongside this call, and guest-gating for protected pages is handled
  // by each page's own RequireAuthGate (AnalyticsPage/SettingsPage/FlashcardsPage) — no
  // separate popup here anymore (it used to fire *in addition to* the page's own gate,
  // showing the same "please log in" message twice).
  const handleTabChange = (_tab: string) => {};

  // Filter public demo courses for HomePage
  const filteredPublicCourses = publicCourses.filter((c) => {
    const matchesCategory = selectedCategory === 'all' || c.categoryId === selectedCategory || c.category.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || c.title.toLowerCase().includes(query) || c.description.toLowerCase().includes(query) || c.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FB] dark:bg-[#0F172A] text-[#1B1F2E] dark:text-[#F1F5F9] transition-colors duration-200">
      
      {/* Top Navigation Bar */}
      <HeaderTopNav
        setCurrentTab={handleTabChange}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenCreateModal={handleOpenCreateModal}
        streakCount={user ? user.streakDays : streakCount}
        user={user}
        onLogout={handleLogout}
        onOpenAuth={(mode) => handleOpenAuth(mode)}
      />

      {/* Main Page Content Body with React Router Routes */}
      <main className="flex-1 pb-20 xl:pb-0">
        <Routes>
            {/* HOME PAGE ROUTE (Displays Platform Public Demo Courses) */}
            <Route
              path="/"
              element={
                <div className="pt-8">
                  <HomePage
                    courses={filteredPublicCourses}
                    categories={categories.length > 0 ? categories : INITIAL_CATEGORIES}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSelectCourse={(courseId) => navigate(`/courses/${courseId}`)}
                    onCreateCourseClick={handleOpenCreateModal}
                    onExploreCourses={() => navigate('/courses')}
                    onExploreFlashcards={() => navigate('/flashcards')}
                  />
                </div>
              }
            />

            {/* COURSES LIBRARY ROUTE (Displays User Created / Saved Courses) */}
            <Route
              path="/courses"
              element={
                <CoursesPage
                  courses={myCourses}
                  categories={categories.length > 0 ? categories : INITIAL_CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={handleSelectCategory}
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onSelectCourse={handleSelectMyCourse}
                  onCreateCourseClick={handleOpenCreateModal}
                  onDeleteCourse={handleDeleteCourse}
                  isLoading={isCoursesLoading}
                />
              }
            />

            {/* DYNAMIC COURSE DETAIL ROUTE (URL DEEP-LINKING BY ID) */}
            <Route
              path="/courses/:courseId"
              element={
                <CourseDetailRouteWrapper
                  onOpenCreateModal={handleOpenCreateModal}
                  onDeleteCourse={handleDeleteCourse}
                />
              }
            />

          {/* FLASHCARDS ROUTE */}
          <Route
            path="/flashcards"
            element={<FlashcardsPage onOpenAuth={(mode) => handleOpenAuth(mode)} />}
          />

          {/* DEDICATED NOTIFICATIONS ROUTE */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* ANALYTICS / PROGRESS ROUTE */}
          <Route path="/progress" element={<AnalyticsPage onOpenAuth={(mode) => handleOpenAuth(mode)} />} />
          <Route path="/analytics" element={<AnalyticsPage onOpenAuth={(mode) => handleOpenAuth(mode)} />} />

          {/* COMMUNITY ROUTE */}
          <Route
            path="/community"
            element={
              <CommunityPage
                onSelectCourse={(courseId) => navigate(`/courses/${courseId}`)}
                onOpenFlashcards={() => navigate('/flashcards')}
              />
            }
          />

          {/* SETTINGS ROUTE */}
          <Route
            path="/settings"
            element={<SettingsPage onBack={() => navigate('/')} onOpenAuth={(mode) => handleOpenAuth(mode)} />}
          />

          {/* AUTH ROUTE */}
          <Route 
            path="/auth" 
            element={
              <AuthPage
                initialMode={authInitialMode}
                redirectReason={authRedirectReason}
                onLoginSuccess={handleLoginSuccess}
              />
            } 
          />
        </Routes>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomNav
        setCurrentTab={handleTabChange}
        dueCount={dueCount}
      />

      {/* Footer Section (Desktop View) */}
      <div className="hidden xl:block">
        <FooterSection />
      </div>

      {/* Auth Modal Popup */}
      <AuthModal
        isOpen={isAuthPopupOpen}
        onClose={() => setIsAuthPopupOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        redirectReason={authRedirectReason}
        initialMode={authInitialMode}
      />

      {/* AI Course Creator Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories.length > 0 ? categories : INITIAL_CATEGORIES}
        onCourseQueued={handleCourseQueued}
        prefillUrl={prefillUrl}
        onCreateCategory={createCategory}
      />

      {/* Auth Requirement Modal for Protected Features */}
      <AuthRequirementModal
        isOpen={authModal.isOpen}
        featureTitle={authModal.featureTitle}
        featureDescription={authModal.featureDescription}
        onClose={() => setAuthModal({ isOpen: false })}
        onConfirmAuth={(mode) => handleAuthConfirmModal(mode || 'login')}
      />

      {/* Course generation queued / other transient notifications */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />

    </div>
  );
}

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <CourseProvider>
            <FlashcardProvider>
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </FlashcardProvider>
          </CourseProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}

export default App;
