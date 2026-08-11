import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  Zap, 
  Mic, 
  MicOff, 
  Flame, 
  Trophy, 
  Gamepad2, 
  Sparkles, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  Target, 
  MessageSquare, 
  Bot, 
  CheckCircle2, 
  UserPlus, 
  Volume2, 
  Award, 
  RefreshCw, 
  Check, 
  X, 
  PhoneCall, 
  Video, 
  VideoOff,
  Hand,
  Maximize2,
  Minimize2,
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Calendar, 
  Activity, 
  CheckSquare, 
  AlertCircle, 
  Send, 
  Globe, 
  ArrowRight,
  ArrowLeft,
  Settings,
  BookOpen,
  FileText,
  ExternalLink,
  FolderPlus,
  Share2,
  Layers,
  GraduationCap
} from 'lucide-react';
import { generateCompletion } from '../../../infrastructure/api/gemini';
import { INITIAL_COURSES } from '../../../infrastructure/data/mockCourses';
import { MOCK_FLASHCARDS } from '../../../infrastructure/data/mockFlashcards';

// Types
interface SquadResource {
  id: string;
  title: string;
  type: 'video' | 'flashcard' | 'document' | 'link' | 'course';
  url: string;
  description: string;
  uploadedBy: string;
  uploadedByAvatar?: string;
  uploadedByRole?: string;
  uploadedAt: string;
  tags: string[];
  autoTasksGenerated?: boolean;
  courseId?: string;
  flashcardDeckId?: string;
  systemMeta?: {
    lessonsCount?: number;
    thumbnailUrl?: string;
    rating?: number;
    badge?: string;
    cardsCount?: number;
  };
}

interface StudySquad {
  id: string;
  name: string;
  avatar: string;
  badge: string;
  targetGoal: 'IELTS 6.5+' | 'Giao tiếp Pro' | 'TOEIC 800+' | 'English for Tech';
  level: 'Cơ bản (A2)' | 'Trung cấp (B1-B2)' | 'Nâng cao (C1)';
  schedule: string;
  membersCount: number;
  maxMembers: number;
  streakDays: number;
  questProgress: number; // 0 - 100%
  description: string;
  creator: string; // Người khởi xướng nhóm (Bình đẳng giữa các thành viên)
  interests: string[];
  isOpen: boolean;
}

interface MemberApplicant {
  id: string;
  name: string;
  avatar: string;
  targetGoal: string;
  level: string;
  appliedDate: string;
  note: string;
  streakHistory: number;
}

interface SquadMemberActivity {
  id: string;
  name: string;
  role: 'Người khởi xướng' | 'Thành viên bình đẳng';
  avatar: string;
  status: 'active' | 'pending' | 'absent';
  studyMinutesToday: number;
  tasksCompleted: number;
  totalTasks: number;
  streakDays: number;
  lastActive: string;
}

interface SquadTask {
  id: string;
  title: string;
  category: 'Speaking' | 'Vocabulary' | 'Writing' | 'Call';
  points: number;
  completedMembersCount: number;
  totalMembersCount: number;
  isUserCompleted: boolean;
}

interface LiveStudyRoom {
  id: string;
  title: string;
  squadName: string;
  topic: string;
  hostName: string;
  mode: 'Public' | 'Squad Only';
  type: 'Voice Call' | 'Video Call';
  activeParticipants: number;
  maxParticipants: number;
  hasAiMc: boolean;
}

export interface PublicUserRoom {
  id: string;
  title: string;
  category: 'game' | 'discussion';
  topic: string;
  activityMode: 'topic' | 'word-chain' | 'taboo';
  hostName: string;
  hostAvatar: string;
  hostRole: string;
  activeParticipants: number;
  maxParticipants: number;
  level: string;
  type: 'Voice Call' | 'Video Call';
  requestStatus: 'idle' | 'pending' | 'approved' | 'rejected';
}

interface CommunitySectionProps {
  onSelectCourse?: (courseId: string) => void;
  onOpenFlashcards?: () => void;
}

export const CommunitySection: React.FC<CommunitySectionProps> = ({ onSelectCourse, onOpenFlashcards }) => {
  // Main Navigation Tabs
  const [activeTab, setActiveTab] = useState<'plaza' | 'public-rooms' | 'squads' | 'manage' | 'live-room' | 'leaderboard'>('plaza');

  // Squad Management Sub Tabs
  const [manageSubTab, setManageSubTab] = useState<'overview' | 'resources' | 'approvals' | 'tasks' | 'activity'>('overview');

  // Shared Squad Resources (Kho Tài Liệu Nhóm - Bình Đẳng)
  const [squadResources, setSquadResources] = useState<SquadResource[]>([
    {
      id: 'res-course-1',
      title: '🎓 Khóa Học Hệ Thống: Become a Certified Web Developer (HTML, CSS, JS)',
      type: 'course',
      url: '#course-c1',
      courseId: 'c1',
      description: 'Khóa học full-stack frontend trên hệ thống với 3 bài học tương tác, lý thuyết, quiz, dictation và AI writing.',
      uploadedBy: 'Minh Trí',
      uploadedByAvatar: 'MT',
      uploadedByRole: 'Thành viên bình đẳng',
      uploadedAt: 'Hôm nay',
      tags: ['Khóa Học Hệ Thống', 'Web Dev', 'Lý Thuyết & Quiz'],
      autoTasksGenerated: true,
      systemMeta: {
        lessonsCount: 3,
        thumbnailUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=800&q=80',
        rating: 5.0,
        badge: 'Khóa Học Hệ Thống'
      }
    },
    {
      id: 'res-flashcard-1',
      title: '🎴 Flashcard Hệ Thống: Set 100 Từ Vựng Chuyên Ngành Web Dev & Tech',
      type: 'flashcard',
      url: '#flashcards-tech',
      flashcardDeckId: 'f1',
      description: 'Bộ thẻ từ vựng lặp lại ngắt quãng (SRS) trực tiếp trên hệ thống giúp ghi nhớ từ vựng lâu dài.',
      uploadedBy: 'Kỳ Duyên',
      uploadedByAvatar: 'KD',
      uploadedByRole: 'Khởi xướng nhóm',
      uploadedAt: 'Hôm nay',
      tags: ['Flashcard Hệ Thống', 'SRS', 'Vocabulary'],
      autoTasksGenerated: true,
      systemMeta: {
        cardsCount: 15,
        badge: 'Spaced Repetition'
      }
    },
    {
      id: 'res-1',
      title: '🎥 IELTS Speaking Part 2 - 10 Mẫu Cấu Trúc Trả Lời Tự Nhiên & Đắt Giá',
      type: 'video',
      url: 'https://youtube.com/watch?v=sample123',
      description: 'Video hướng dẫn cách triển khai ý tưởng Part 2 theo khung Time-Place-Feeling mà không bị ngập ngừng.',
      uploadedBy: 'Minh Trí',
      uploadedByAvatar: 'MT',
      uploadedByRole: 'Thành viên bình đẳng',
      uploadedAt: 'Hôm qua',
      tags: ['IELTS Speaking', 'Part 2', 'Video'],
      autoTasksGenerated: true
    },
    {
      id: 'res-3',
      title: '📄 Document: Ebook 20 Bài Mẫu Writing Task 2 Đạt Band 7.5+',
      type: 'document',
      url: 'https://drive.google.com/sample-writing-pdf',
      description: 'Tài liệu PDF tổng hợp các bài mẫu Writing có chú giải cấu trúc câu & phrasal verbs đắt giá.',
      uploadedBy: 'Bảo Ngọc',
      uploadedByAvatar: 'BN',
      uploadedByRole: 'Thành viên bình đẳng',
      uploadedAt: '3 ngày trước',
      tags: ['Writing Task 2', 'Ebook PDF', 'Band 7.5+'],
      autoTasksGenerated: false
    }
  ]);

  // Modal for Adding Resource
  const [isAddResourceOpen, setIsAddResourceOpen] = useState<boolean>(false);
  const [resourceSourceMode, setResourceSourceMode] = useState<'system' | 'custom'>('system');
  const [selectedSystemItemType, setSelectedSystemItemType] = useState<'course' | 'flashcard'>('course');
  const [selectedSystemCourseId, setSelectedSystemCourseId] = useState<string>(INITIAL_COURSES[0]?.id || 'c1');
  const [newResTitle, setNewResTitle] = useState<string>('');
  const [newResType, setNewResType] = useState<'video' | 'flashcard' | 'document' | 'link' | 'course'>('course');
  const [newResUrl, setNewResUrl] = useState<string>('');
  const [newResDesc, setNewResDesc] = useState<string>('');
  const [newResTags, setNewResTags] = useState<string>('Khóa học chung, IELTS');

  // Filter states for Matchmaking
  const [selectedGoal, setSelectedGoal] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Voice Matching Modal state
  const [isMatchingModalOpen, setIsMatchingModalOpen] = useState<boolean>(false);
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'searching' | 'matched'>('idle');
  const [matchedPartner, setMatchedPartner] = useState<{
    name: string;
    avatar: string;
    level: string;
    topic: string;
  } | null>(null);

  // Live Study Room State
  const [isLiveCallActive, setIsLiveCallActive] = useState<boolean>(false);
  const [activeRoomTitle, setActiveRoomTitle] = useState<string>('Phòng Speaking IELTS Task 2 - Topic Environment');
  const [activeGame, setActiveGame] = useState<'topic' | 'word-chain' | 'taboo'>('topic');
  const [selectedRoomActivity, setSelectedRoomActivity] = useState<'topic' | 'word-chain' | 'taboo'>('topic');
  const [gameScore, setGameScore] = useState<number>(0);
  const [aiTopicCards, setAiTopicCards] = useState<string[]>([
    "Chủ đề hôm nay: Describe your favorite travel memory using at least 3 adjectives.",
    "Từ vựng nên dùng: Breathtaking, Unforgettable, Local delicacy, Picturesque",
    "Gợi ý mở đầu: 'One of the most memorable trips I've ever taken was when...'"
  ]);
  const [isGeneratingAiTopic, setIsGeneratingAiTopic] = useState<boolean>(false);
  const [micOn, setMicOn] = useState<boolean>(true);
  const [camOn, setCamOn] = useState<boolean>(true);
  const [handRaised, setHandRaised] = useState<boolean>(false);
  const [isCallMaximized, setIsCallMaximized] = useState<boolean>(false);
  const [isMicTesting, setIsMicTesting] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>('');

  // Interactive Game Inputs and Turns
  const [wordChainHistory, setWordChainHistory] = useState<string[]>(['EDUCATION', 'NATURE', 'ENVIRONMENT']);
  const [wordChainInput, setWordChainInput] = useState<string>('');
  const [tabooGuessInput, setTabooGuessInput] = useState<string>('');
  const [tabooFeedback, setTabooFeedback] = useState<string>('');
  const [activeTurnPlayer, setActiveTurnPlayer] = useState<string>('Kỳ Duyên (Bạn)');
  const [customLobbyTopic, setCustomLobbyTopic] = useState<string>('Topic Environment & Climate Change (IELTS Task 2)');

  // Modals state
  const [isCreateSquadOpen, setIsCreateSquadOpen] = useState<boolean>(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState<boolean>(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);

  // Public Rooms Directory State
  const [isPublicRoomsModalOpen, setIsPublicRoomsModalOpen] = useState<boolean>(false);
  const [publicRoomsCategory, setPublicRoomsCategory] = useState<'all' | 'game' | 'discussion'>('game');
  const [publicSearchQuery, setPublicSearchQuery] = useState<string>('');
  const [publicLevelFilter, setPublicLevelFilter] = useState<string>('All');

  const [isCreatingPublicRoom, setIsCreatingPublicRoom] = useState<boolean>(false);
  const [newPubRoomTitle, setNewPubRoomTitle] = useState<string>('');
  const [newPubRoomTopic, setNewPubRoomTopic] = useState<string>('');
  const [newPubRoomCategory, setNewPubRoomCategory] = useState<'game' | 'discussion'>('game');
  const [newPubRoomMode, setNewPubRoomMode] = useState<'topic' | 'word-chain' | 'taboo'>('word-chain');
  const [newPubRoomMax, setNewPubRoomMax] = useState<number>(6);
  const [newPubRoomLevel, setNewPubRoomLevel] = useState<string>('B1-B2 (Trung cấp)');

  const [publicRooms, setPublicRooms] = useState<PublicUserRoom[]>([
    {
      id: 'pub-room-1',
      title: '🎮 Sảnh Game Đêm: Taboo & Nối Từ Band 6.5+',
      category: 'game',
      topic: 'Game Đoán Từ Taboo & Nối Chữ Từ Vựng Du Lịch & Cuộc Sống',
      activityMode: 'taboo',
      hostName: 'Trần Minh Thu',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      hostRole: 'Chủ phòng (IELTS 7.5)',
      activeParticipants: 4,
      maxParticipants: 6,
      level: 'B1-B2 (Trung cấp)',
      type: 'Voice Call',
      requestStatus: 'idle'
    },
    {
      id: 'pub-room-2',
      title: '🔤 Thử Thách Nối Từ Tiếng Anh - Chuyên Ngành Tech & AI',
      category: 'game',
      topic: 'Nối từ tiếng Anh IT, phần mềm & Thưởng điểm thi đua chuỗi nhóm',
      activityMode: 'word-chain',
      hostName: 'Lê Quốc Bảo',
      hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      hostRole: 'Chủ phòng (Tech Leader)',
      activeParticipants: 3,
      maxParticipants: 5,
      level: 'C1 (Nâng cao)',
      type: 'Voice Call',
      requestStatus: 'idle'
    },
    {
      id: 'pub-room-3',
      title: '🎲 Taboo Challenge: Đoán Từ Bí Mật KhÔNG Dùng Từ Cấm',
      category: 'game',
      topic: 'Luyện phản xạ diễn đạt từ vựng IELTS C1-C2 không bị bí ý',
      activityMode: 'taboo',
      hostName: 'Phạm Hoàng Anh',
      hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      hostRole: 'Chủ phòng (Band 8.0)',
      activeParticipants: 2,
      maxParticipants: 4,
      level: 'A2-B1 (Cơ bản)',
      type: 'Voice Call',
      requestStatus: 'idle'
    },
    {
      id: 'pub-room-4',
      title: '🗣️ Topic Tranh Luận: "AI in Education - Pros & Cons"',
      category: 'discussion',
      topic: 'Luyện tư duy phản biện & Sử dụng từ vựng nâng cao C1 theo câu hỏi AI MC',
      activityMode: 'topic',
      hostName: 'Nguyễn Văn Nam',
      hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      hostRole: 'Chủ phòng (IELTS 7.5)',
      activeParticipants: 4,
      maxParticipants: 5,
      level: 'B2-C1 (Khá - Giỏi)',
      type: 'Voice Call',
      requestStatus: 'idle'
    },
    {
      id: 'pub-room-5',
      title: '💬 Speaking IELTS Task 2 - Environment & Climate Action',
      category: 'discussion',
      topic: 'Thảo luận giải pháp biến đổi khí hậu & nhận gợi ý sửa lỗi AI MC',
      activityMode: 'topic',
      hostName: 'Vũ Thị Mai',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      hostRole: 'Chủ phòng (IELTS Trainer)',
      activeParticipants: 3,
      maxParticipants: 4,
      level: 'B1-B2 (Trung cấp)',
      type: 'Video Call',
      requestStatus: 'idle'
    },
    {
      id: 'pub-room-6',
      title: '☕ English Coffee Chat - Career Goals & Work-Life Balance',
      category: 'discussion',
      topic: 'Trò chuyện tự do, chia sẻ mục tiêu sự nghiệp & thói quen học tập',
      activityMode: 'topic',
      hostName: 'Trịnh Bảo Ngọc',
      hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      hostRole: 'Chủ phòng (Giao Tiếp Pro)',
      activeParticipants: 2,
      maxParticipants: 5,
      level: 'A2-B1 (Cơ bản)',
      type: 'Voice Call',
      requestStatus: 'idle'
    }
  ]);

  // Handlers for Requesting & Joining Public Rooms
  const handleRequestJoinPublicRoom = (roomId: string) => {
    setPublicRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return { ...room, requestStatus: 'pending' };
      }
      return room;
    }));

    // Auto approve after 2.5 seconds to simulate host approving
    setTimeout(() => {
      setPublicRooms(prev => prev.map(room => {
        if (room.id === roomId) {
          return { ...room, requestStatus: 'approved' };
        }
        return room;
      }));
    }, 2500);
  };

  const handleInstantApproveRequest = (roomId: string) => {
    setPublicRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return { ...room, requestStatus: 'approved' };
      }
      return room;
    }));
  };

  const handleEnterApprovedPublicRoom = (room: PublicUserRoom) => {
    setIsPublicRoomsModalOpen(false);
    setActiveRoomTitle(room.title);
    setCustomLobbyTopic(room.topic);
    setActiveGame(room.activityMode);
    setActiveTab('live-room');
    setIsLiveCallActive(false); // Sảnh chờ phòng call sẵn sàng!
  };

  const handleCreateNewPublicRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPubRoomTitle.trim()) return;

    const createdRoom: PublicUserRoom = {
      id: `pub-user-${Date.now()}`,
      title: newPubRoomTitle,
      category: newPubRoomCategory,
      topic: newPubRoomTopic || 'Thảo luận tự do & Luyện phản xạ',
      activityMode: newPubRoomMode,
      hostName: 'Kỳ Duyên (Bạn)',
      hostAvatar: 'KD',
      hostRole: 'Chủ phòng (Bạn tạo)',
      activeParticipants: 1,
      maxParticipants: newPubRoomMax,
      level: newPubRoomLevel,
      type: 'Voice Call',
      requestStatus: 'approved'
    };

    setPublicRooms(prev => [createdRoom, ...prev]);
    setIsCreatingPublicRoom(false);
    setNewPubRoomTitle('');
    setNewPubRoomTopic('');
    alert('🎉 Đã tạo phòng Public thành công! Phòng của bạn đã hiển thị cho cộng đồng tham gia.');
  };

  // Forms State
  const [newSquadName, setNewSquadName] = useState<string>('');
  const [newSquadGoal, setNewSquadGoal] = useState<any>('IELTS 6.5+');
  const [newSquadSchedule, setNewSquadSchedule] = useState<string>('20:30 - 21:30 Mỗi tối');

  const [newRoomTitle, setNewRoomTitle] = useState<string>('');
  const [newRoomTopic, setNewRoomTopic] = useState<string>('Chủ đề tự do / IELTS Speaking');
  const [newRoomMode, setNewRoomMode] = useState<'Public' | 'Squad Only'>('Squad Only');
  const [newRoomType, setNewRoomType] = useState<'Voice Call' | 'Video Call'>('Voice Call');

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskCategory, setNewTaskCategory] = useState<'Speaking' | 'Vocabulary' | 'Writing' | 'Call'>('Speaking');
  const [newTaskPoints, setNewTaskPoints] = useState<number>(50);

  // Sample Squads Data
  const [squads, setSquads] = useState<StudySquad[]>([
    {
      id: 'squad-1',
      name: 'IELTS Band 7.5 Warriors 🚀',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      badge: 'Top 1 Weekly',
      targetGoal: 'IELTS 6.5+',
      level: 'Trung cấp (B1-B2)',
      schedule: '21:00 - 22:00 Mỗi tối',
      membersCount: 4,
      maxMembers: 5,
      streakDays: 18,
      questProgress: 85,
      description: 'Nhóm cùng luyện Speaking & Writing task 2 hàng ngày. Kỷ luật cao, điểm danh mỗi ngày!',
      creator: 'Kỳ Duyên',
      interests: ['IELTS', 'Phim ảnh', 'Du lịch'],
      isOpen: true
    },
    {
      id: 'squad-2',
      name: 'Tech & AI Talkers 🤖',
      avatar: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150',
      badge: 'Siêu Tích Cực',
      targetGoal: 'English for Tech',
      level: 'Nâng cao (C1)',
      schedule: '20:00 - 21:00 Thứ 2,4,6',
      membersCount: 5,
      maxMembers: 6,
      streakDays: 24,
      questProgress: 100,
      description: 'Chuyên thảo luận tin tức công nghệ, phỏng vấn IT bằng Tiếng Anh và thuyết trình dự án.',
      creator: 'Minh Trí',
      interests: ['Công nghệ', 'Startup', 'Lập trình'],
      isOpen: true
    },
    {
      id: 'squad-3',
      name: 'Giao Tiếp Tự Tin 100% ☕',
      avatar: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=150',
      badge: 'Thân Thiện',
      targetGoal: 'Giao tiếp Pro',
      level: 'Cơ bản (A2)',
      schedule: '19:30 - 20:30 Hàng ngày',
      membersCount: 3,
      maxMembers: 4,
      streakDays: 12,
      questProgress: 60,
      description: 'Luyện nói từ cơ bản, không sợ sai ngữ pháp! Môi trường vui vẻ, hòa đồng và động viên nhau.',
      creator: 'Bảo Ngọc',
      interests: ['Âm nhạc', 'Ẩm thực', 'Cuộc sống'],
      isOpen: true
    },
    {
      id: 'squad-4',
      name: 'TOEIC 850+ Chinh Phục 🎯',
      avatar: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150',
      badge: 'Kỷ Luật Cao',
      targetGoal: 'TOEIC 800+',
      level: 'Trung cấp (B1-B2)',
      schedule: '21:30 - 22:30 Thứ 3,5,7',
      membersCount: 3,
      maxMembers: 5,
      streakDays: 9,
      questProgress: 45,
      description: 'Chuyên giải đề Part 5, 6, 7 & luyện nghe Part 3, 4 theo phương pháp shadow reading.',
      creator: 'Hoàng Nam',
      interests: ['TOEIC', 'Kinh doanh', 'Đọc sách'],
      isOpen: true
    }
  ]);

  // Applicants pending approval for current squad
  const [pendingApplicants, setPendingApplicants] = useState<MemberApplicant[]>([
    {
      id: 'app-1',
      name: 'Nguyễn Văn Hải',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      targetGoal: 'IELTS 6.5+',
      level: 'B1 (Intermediate)',
      appliedDate: '10 phút trước',
      note: 'Chào nhóm, mình đang muốn luyện IELTS Speaking part 2 & 3. Cam kết học đều khung giờ 21h hàng tối!',
      streakHistory: 14
    },
    {
      id: 'app-2',
      name: 'Trần Thu Phương',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      targetGoal: 'IELTS 7.0+',
      level: 'B2 (Upper-Intermediate)',
      appliedDate: '1 giờ trước',
      note: 'Mình cần môi trường giao tiếp phản xạ tự nhiên. Rất mong được gia nhập nhóm cùng luyện tập!',
      streakHistory: 21
    }
  ]);

  // Detailed Activity Tracking for Squad Members (Bình Đẳng)
  const [memberActivities, setMemberActivities] = useState<SquadMemberActivity[]>([
    {
      id: 'mem-1',
      name: 'Kỳ Duyên (Bạn)',
      role: 'Người khởi xướng',
      avatar: 'KD',
      status: 'active',
      studyMinutesToday: 45,
      tasksCompleted: 3,
      totalTasks: 3,
      streakDays: 18,
      lastActive: 'Đang online'
    },
    {
      id: 'mem-2',
      name: 'Minh Trí',
      role: 'Thành viên bình đẳng',
      avatar: 'MT',
      status: 'active',
      studyMinutesToday: 30,
      tasksCompleted: 3,
      totalTasks: 3,
      streakDays: 18,
      lastActive: '5 phút trước'
    },
    {
      id: 'mem-3',
      name: 'Bảo Ngọc',
      role: 'Thành viên bình đẳng',
      avatar: 'BN',
      status: 'active',
      studyMinutesToday: 20,
      tasksCompleted: 2,
      totalTasks: 3,
      streakDays: 18,
      lastActive: '25 phút trước'
    },
    {
      id: 'mem-4',
      name: 'Hoàng Nam',
      role: 'Thành viên bình đẳng',
      avatar: 'HN',
      status: 'pending',
      studyMinutesToday: 0,
      tasksCompleted: 0,
      totalTasks: 3,
      streakDays: 17,
      lastActive: 'Hôm qua'
    }
  ]);

  // Daily Squad Tasks List
  const [squadTasks, setSquadTasks] = useState<SquadTask[]>([
    {
      id: 'task-1',
      title: '🎙️ Luyện nói 15 phút trong Phòng Call Nhóm',
      category: 'Speaking',
      points: 50,
      completedMembersCount: 3,
      totalMembersCount: 4,
      isUserCompleted: true
    },
    {
      id: 'task-2',
      title: '📖 Học 10 từ vựng đắt giá từ AI Topic Card',
      category: 'Vocabulary',
      points: 30,
      completedMembersCount: 3,
      totalMembersCount: 4,
      isUserCompleted: true
    },
    {
      id: 'task-3',
      title: '✍️ Viết 1 bài mở bài IELTS Writing Task 2',
      category: 'Writing',
      points: 40,
      completedMembersCount: 2,
      totalMembersCount: 4,
      isUserCompleted: true
    }
  ]);

  // Live Study Rooms
  const [liveRooms, setLiveRooms] = useState<LiveStudyRoom[]>([
    {
      id: 'room-1',
      title: 'Phòng Speaking IELTS Task 2 - Topic Environment',
      squadName: 'IELTS Band 7.5 Warriors 🚀',
      topic: 'Chủ đề Môi Trường & Biến Đổi Khí Hậu',
      hostName: 'Kỳ Duyên',
      mode: 'Squad Only',
      type: 'Voice Call',
      activeParticipants: 4,
      maxParticipants: 5,
      hasAiMc: true
    },
    {
      id: 'room-2',
      title: '🎮 Sảnh Game Đêm: Taboo & Nối Từ Tiếng Anh',
      squadName: 'Cộng đồng chung',
      topic: 'Game Nhìn Hình Đoán Chữ & Từ Vựng Du Lịch',
      hostName: 'Talk2Me AI Bot',
      mode: 'Public',
      type: 'Voice Call',
      activeParticipants: 12,
      maxParticipants: 20,
      hasAiMc: true
    }
  ]);

  // Approval Handlers
  const handleApproveMember = (applicant: MemberApplicant) => {
    setPendingApplicants(prev => prev.filter(a => a.id !== applicant.id));
    // Add to member activities
    const newMember: SquadMemberActivity = {
      id: `mem-${Date.now()}`,
      name: applicant.name,
      role: 'Thành viên bình đẳng',
      avatar: applicant.name.slice(0, 2).toUpperCase(),
      status: 'pending',
      studyMinutesToday: 0,
      tasksCompleted: 0,
      totalTasks: 3,
      streakDays: applicant.streakHistory,
      lastActive: 'Vừa gia nhập'
    };
    setMemberActivities(prev => [...prev, newMember]);
    alert(`🎉 Đã phê duyệt thành viên ${applicant.name} vào nhóm thành công! (Quyền bình đẳng như mọi thành viên)`);
  };

  const handleDeclineMember = (applicantId: string) => {
    setPendingApplicants(prev => prev.filter(a => a.id !== applicantId));
  };

  // Add new Shared Resource Handler (Kho tài liệu nhóm)
  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();

    if (resourceSourceMode === 'system') {
      if (selectedSystemItemType === 'course') {
        const course = INITIAL_COURSES.find(c => c.id === selectedSystemCourseId) || INITIAL_COURSES[0];
        const newResource: SquadResource = {
          id: `res-course-${Date.now()}`,
          title: `🎓 Khóa Học Hệ Thống: ${course.title}`,
          type: 'course',
          url: `#course-${course.id}`,
          courseId: course.id,
          description: course.description,
          uploadedBy: 'Kỳ Duyên (Bạn)',
          uploadedByAvatar: 'KD',
          uploadedByRole: 'Thành viên nhóm',
          uploadedAt: 'Vừa xong',
          tags: ['Khóa Học Hệ Thống', course.category, course.difficulty],
          autoTasksGenerated: false,
          systemMeta: {
            lessonsCount: course.lessons.length,
            thumbnailUrl: course.thumbnailUrl,
            rating: course.rating,
            badge: course.category
          }
        };
        setSquadResources(prev => [newResource, ...prev]);
        setIsAddResourceOpen(false);
        handleGenerateTasksFromResource(newResource);
        return;
      } else {
        const newResource: SquadResource = {
          id: `res-flash-${Date.now()}`,
          title: '🎴 Flashcard Hệ Thống: Set 100 Từ Vựng Lặp Lại Ngắt Quãng (SRS)',
          type: 'flashcard',
          url: '#flashcards-system',
          flashcardDeckId: 'f1',
          description: 'Bộ thẻ từ vựng lặp lại ngắt quãng (SRS) trực tiếp trên hệ thống giúp học từ vựng nhanh & nhớ lâu.',
          uploadedBy: 'Kỳ Duyên (Bạn)',
          uploadedByAvatar: 'KD',
          uploadedByRole: 'Thành viên nhóm',
          uploadedAt: 'Vừa xong',
          tags: ['Flashcard Hệ Thống', 'SRS', 'Vocabulary'],
          autoTasksGenerated: false,
          systemMeta: {
            cardsCount: 15,
            badge: 'Spaced Repetition'
          }
        };
        setSquadResources(prev => [newResource, ...prev]);
        setIsAddResourceOpen(false);
        handleGenerateTasksFromResource(newResource);
        return;
      }
    }

    if (!newResTitle.trim()) return;

    const newResource: SquadResource = {
      id: `res-${Date.now()}`,
      title: newResTitle.trim(),
      type: newResType,
      url: newResUrl.trim() || '#',
      description: newResDesc.trim() || 'Tài liệu học tập chia sẻ chung cho tất cả các thành viên trong nhóm.',
      uploadedBy: 'Kỳ Duyên (Bạn)',
      uploadedByAvatar: 'KD',
      uploadedByRole: 'Thành viên nhóm',
      uploadedAt: 'Vừa xong',
      tags: newResTags.split(',').map(t => t.trim()).filter(Boolean),
      autoTasksGenerated: false
    };

    setSquadResources(prev => [newResource, ...prev]);
    setIsAddResourceOpen(false);
    setNewResTitle('');
    setNewResUrl('');
    setNewResDesc('');

    // Auto-generate revision tasks for all squad members
    handleGenerateTasksFromResource(newResource);
  };

  // AI Auto-generate Daily Squad Tasks from uploaded Resource
  const handleGenerateTasksFromResource = (res: SquadResource) => {
    const task1Title = `📖 Ôn tập tài liệu: "${res.title.slice(0, 40)}..."`;
    const task2Title = res.type === 'video'
      ? `🎙️ Thảo luận 3 điểm quan trọng từ Video chia sẻ bởi ${res.uploadedBy}`
      : res.type === 'flashcard'
      ? `⚡ Học xong bộ Flashcards từ kho tài liệu của ${res.uploadedBy}`
      : `✍️ Thực hành áp dụng 3 từ vựng/cấu trúc từ "${res.title.slice(0, 30)}"`;

    const generatedTasks: SquadTask[] = [
      {
        id: `task-gen-1-${Date.now()}`,
        title: task1Title,
        category: res.type === 'video' ? 'Speaking' : res.type === 'flashcard' ? 'Vocabulary' : 'Writing',
        points: 40,
        completedMembersCount: 0,
        totalMembersCount: memberActivities.length,
        isUserCompleted: false
      },
      {
        id: `task-gen-2-${Date.now()}`,
        title: task2Title,
        category: 'Vocabulary',
        points: 50,
        completedMembersCount: 0,
        totalMembersCount: memberActivities.length,
        isUserCompleted: false
      }
    ];

    setSquadTasks(prev => [...prev, ...generatedTasks]);
    setSquadResources(prev => prev.map(r => r.id === res.id ? { ...r, autoTasksGenerated: true } : r));

    alert(`🤖 Hệ thống AI đã quét tài liệu "${res.title}" và tự động tạo 2 Nhiệm vụ ôn tập chung cho tất cả thành viên trong nhóm!`);
  };

  // Toggle task completed for current user
  const handleToggleTask = (taskId: string) => {
    setSquadTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.isUserCompleted;
        return {
          ...t,
          isUserCompleted: nextCompleted,
          completedMembersCount: nextCompleted ? t.completedMembersCount + 1 : t.completedMembersCount - 1
        };
      }
      return t;
    }));
  };

  // Add custom task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: SquadTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      points: newTaskPoints,
      completedMembersCount: 0,
      totalMembersCount: memberActivities.length,
      isUserCompleted: false
    };

    setSquadTasks(prev => [...prev, newTask]);
    setIsAddTaskOpen(false);
    setNewTaskTitle('');
  };

  // Create Live Room Handler
  const handleCreateLiveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const createdTitle = newRoomTitle.trim() || 'Phòng Luyện Nói Nhóm Mới';
    
    const newRoom: LiveStudyRoom = {
      id: `room-${Date.now()}`,
      title: createdTitle,
      squadName: 'IELTS Band 7.5 Warriors 🚀',
      topic: newRoomTopic,
      hostName: 'Kỳ Duyên',
      mode: newRoomMode,
      type: newRoomType,
      activeParticipants: 1,
      maxParticipants: 5,
      hasAiMc: true
    };

    setLiveRooms(prev => [newRoom, ...prev]);
    setIsCreateRoomOpen(false);
    setActiveRoomTitle(createdTitle);
    setCustomLobbyTopic(newRoomTopic);
    setActiveGame(selectedRoomActivity);
    setActiveTab('live-room');
    setIsLiveCallActive(false); // <--- Starts in Lobby (sảnh chờ)!
  };

  // Game Handlers
  const handleWordChainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordChainInput.trim()) return;
    const word = wordChainInput.trim().toUpperCase();
    const lastWord = wordChainHistory[wordChainHistory.length - 1];
    const requiredChar = lastWord.charAt(lastWord.length - 1);
    if (word.charAt(0) !== requiredChar) {
      alert(`⚠️ Từ nối phải bắt đầu bằng chữ '${requiredChar}'! Bạn đã nhập '${word.charAt(0)}'.`);
      return;
    }
    setWordChainHistory(prev => [...prev, word]);
    setGameScore(prev => prev + 15);
    setWordChainInput('');
    setActiveTurnPlayer(prev => prev === 'Kỳ Duyên (Bạn)' ? 'Minh Trí' : prev === 'Minh Trí' ? 'Bảo Ngọc' : 'Kỳ Duyên (Bạn)');
  };

  const handleTabooSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tabooGuessInput.trim()) return;
    const guess = tabooGuessInput.trim().toLowerCase();
    if (guess.includes('telescope') || guess.includes('kính thiên văn')) {
      setGameScore(prev => prev + 25);
      setTabooFeedback('🎉 Chính xác! Từ bí mật là TELESCOPE (+25 Pts)');
    } else {
      setTabooFeedback(`❌ '${tabooGuessInput}' chưa đúng. Gợi ý: Dụng cụ quan sát các vì sao xa xôi!`);
    }
    setTabooGuessInput('');
  };

  // Quick Matchmaking logic simulation
  const handleStartQuickMatch = () => {
    setIsMatchingModalOpen(true);
    setMatchingStatus('searching');
    setTimeout(() => {
      setMatchingStatus('matched');
      setMatchedPartner({
        name: 'Alex Rivera (Hà Nội)',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        level: 'IELTS 6.5 • Trung cấp B2',
        topic: 'Thảo luận về thói quen học tập & sở thích xem phim tiếng Anh'
      });
    }, 2200);
  };

  // Generate new AI Topic Cards using Gemini
  const handleGenerateNewAiTopic = async () => {
    setIsGeneratingAiTopic(true);
    try {
      const prompt = `Hãy tạo 1 thẻ thảo luận tiếng Anh ngắn gồm: 1 câu hỏi chủ đề giao tiếp hay, 4 từ vựng đắt giá nên dùng, và 1 câu gợi ý mở đầu bằng tiếng Anh kèm giải thích tiếng Việt ngắn gọn. Trả về dạng JSON dạng văn bản sạch.`;
      const res = await generateCompletion(prompt);
      setAiTopicCards([
        `💡 AI Topic Mới: ${res.slice(0, 180)}...`,
        "Gợi ý: Hãy phân công từng thành viên nói trong 2 phút!",
        "Mục tiêu nhóm: Sử dụng ít nhất 2 từ vựng mới trong bài nói."
      ]);
    } catch {
      setAiTopicCards([
        "💡 AI Topic: Describe a skill you would like to master in the next 6 months.",
        "Vocabulary: Mastery, Dedication, Steep learning curve, Breakthrough",
        "Starter: 'If I could master one new skill effortlessly, it would definitely be...'"
      ]);
    } finally {
      setIsGeneratingAiTopic(false);
    }
  };

  // AI Finish Call & Summarize Error
  const handleFinishCallAndSummarize = async () => {
    setIsLiveCallActive(false);
    setAiSummary("Đang nhờ AI phân tích lại lượt nói của nhóm...");
    try {
      const prompt = `Hãy viết một bản tóm tắt nhận xét buổi học tiếng Anh nhóm ngắn gọn, động viên bằng Tiếng Việt. Bao gồm: 3 từ vựng hay nhóm đã dùng, 2 lỗi ngữ pháp nhỏ cần lưu ý (kèm sửa lại đúng) và chấm điểm năng nổ 9.5/10.`;
      const res = await generateCompletion(prompt);
      setAiSummary(res);
    } catch {
      setAiSummary("🎉 Tóm tắt buổi học từ AI MC: Nhóm phát âm rất tự nhiên! Cần chú ý nhấn trọng âm từ 'Development' và chia thì quá khứ đơn 'went' thay vì 'go' khi kể chuyện. Điểm năng nổ: 9.8/10 🔥");
    }
  };

  // Create Squad Handler
  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName.trim()) return;

    const created: StudySquad = {
      id: `squad-${Date.now()}`,
      name: newSquadName.trim(),
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      badge: 'Tân Binh',
      targetGoal: newSquadGoal,
      level: 'Trung cấp (B1-B2)',
      schedule: newSquadSchedule,
      membersCount: 1,
      maxMembers: 5,
      streakDays: 1,
      questProgress: 20,
      description: 'Nhóm học tập mới tạo! Chào mừng các bạn có cùng mục tiêu gia nhập.',
      creator: 'Bạn (Kỳ Duyên)',
      interests: ['Học tập', 'Giao tiếp'],
      isOpen: true
    };

    setSquads([created, ...squads]);
    setIsCreateSquadOpen(false);
    setNewSquadName('');
  };

  // Filtered Squads
  const filteredSquads = squads.filter(s => {
    const matchesGoal = selectedGoal === 'All' || s.targetGoal === selectedGoal;
    const matchesLevel = selectedLevel === 'All' || s.level === selectedLevel;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGoal && matchesLevel && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* MAIN LAYOUT WITH SIDEBAR NAVIGATION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 items-start">
        {/* SIDEBAR NAVIGATION */}
        <aside className="lg:col-span-1 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl lg:rounded-3xl p-3.5 sm:p-5 lg:py-6 lg:px-4 shadow-sm space-y-3 sm:space-y-4 lg:space-y-6 lg:sticky lg:top-4">
          
          {/* COMMUNITY HEADER IN SIDEBAR */}
          <div className="px-1 space-y-2 pb-3 lg:pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-base sm:text-lg font-black text-[#1B1F2E] dark:text-white tracking-tight flex items-center gap-1.5 min-w-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#2E68FF] shrink-0" />
                <span className="truncate">Cộng Đồng & Squad</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-200/80 dark:border-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                115 Online
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug hidden sm:block">
              Kết nối bạn học, ghép nói 1-1 & làm bài tập nhóm.
            </p>

            {/* QUICK CREATION ACTIONS IN SIDEBAR */}
            <div className="grid grid-cols-2 gap-2 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(true)}
                className="py-2 px-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Radio className="w-3.5 h-3.5 shrink-0" />
                <span>Tạo phòng</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateSquadOpen(true)}
                className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Tạo nhóm</span>
              </button>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="px-2 hidden lg:block">
              <div className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                Danh Mục Tương Tác
              </div>
            </div>

            {/* Navigation Items - Horizontal scroll on mobile, vertical stack on desktop */}
            <nav className="flex lg:flex-col overflow-x-auto scrollbar-none gap-1.5 pb-1 lg:pb-0 -mx-1 px-1">
            {/* Tab 1: Sảnh Chung */}
            <button
              type="button"
              onClick={() => setActiveTab('plaza')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'plaza'
                  ? 'bg-[#2E68FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50 dark:bg-slate-900/50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Globe className={`w-4 h-4 shrink-0 ${activeTab === 'plaza' ? 'text-white' : 'text-[#2E68FF]'}`} />
                <span className="whitespace-nowrap">Sảnh Chung</span>
              </div>
              <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black ${
                activeTab === 'plaza' ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-blue-950 text-[#2E68FF]'
              }`}>Nổi Bật</span>
            </button>


            {/* Tab 2: Tìm Nhóm */}
            <button
              type="button"
              onClick={() => setActiveTab('squads')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'squads'
                  ? 'bg-[#2E68FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50 dark:bg-slate-900/50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Search className={`w-4 h-4 shrink-0 ${activeTab === 'squads' ? 'text-white' : 'text-[#2E68FF]'}`} />
                <span className="whitespace-nowrap">Tìm Nhóm Squad</span>
              </div>
              <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black ${
                activeTab === 'squads' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>{squads.length}</span>
            </button>

            {/* Tab 3: Quản Lý Nhóm */}
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'manage'
                  ? 'bg-[#2E68FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50 dark:bg-slate-900/50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <ShieldCheck className={`w-4 h-4 shrink-0 ${activeTab === 'manage' ? 'text-white' : 'text-emerald-500'}`} />
                <span className="whitespace-nowrap">Nhóm Của Tôi</span>
              </div>
              {pendingApplicants.length > 0 ? (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white font-black text-[10px] flex items-center justify-center animate-pulse shrink-0">
                  {pendingApplicants.length}
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black ${
                  activeTab === 'manage' ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                }`}>Quản lý</span>
              )}
            </button>

            {/* Tab 4: Phòng Call Live */}
            <button
              type="button"
              onClick={() => setActiveTab('live-room')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'live-room'
                  ? 'bg-[#2E68FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50 dark:bg-slate-900/50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Radio className={`w-4 h-4 shrink-0 ${activeTab === 'live-room' ? 'text-white' : 'text-red-500 animate-pulse'}`} />
                <span className="whitespace-nowrap">Phòng Call Live</span>
              </div>
              <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black ${
                activeTab === 'live-room' ? 'bg-white/20 text-white' : 'bg-red-100 dark:bg-red-950 text-red-600'
              }`}>{liveRooms.length}</span>
            </button>

            {/* Tab 5: Bảng Xếp Hạng */}
            <button
              type="button"
              onClick={() => setActiveTab('leaderboard')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl font-bold text-xs transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#2E68FF] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 bg-slate-50 dark:bg-slate-900/50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Trophy className={`w-4 h-4 shrink-0 ${activeTab === 'leaderboard' ? 'text-white' : 'text-amber-500'}`} />
                <span className="whitespace-nowrap">Bảng Xếp Hạng</span>
              </div>
              <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-black ${
                activeTab === 'leaderboard' ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-600'
              }`}>Top 10</span>
            </button>
          </nav>
        </div>

          {/* SIDEBAR QUICK ACTIONS & STATS (Hidden on mobile to reduce scroll height) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3 hidden lg:block">
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#1B1F2E] dark:text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#2E68FF] fill-[#2E68FF]" /> Ghép Nói 1-1 Nhanh
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                Ghép ngẫu nhiên bạn học nói tiếng Anh 10 phút để tăng phản xạ tự nhiên.
              </p>
              <button
                type="button"
                onClick={handleStartQuickMatch}
                className="w-full mt-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2E68FF] dark:hover:bg-[#2E68FF] text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs transition-all border border-slate-200 dark:border-slate-700 group"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-600 dark:fill-slate-300 group-hover:fill-white text-slate-600 dark:text-slate-300 group-hover:text-white transition-colors" />
                <span>Bắt Đầu Ghép Ngay</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Thành viên hoạt động:</span>
                <span className="text-emerald-600 font-extrabold">115 Online</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>Nhóm Squad mở:</span>
                <span className="text-[#2E68FF] font-extrabold">{squads.length} nhóm</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="lg:col-span-3 min-w-0">
          {/* TAB 1: PUBLIC PLAZA */}
      {activeTab === 'plaza' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
            {/* Quick Match Showcase */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] space-y-3 flex flex-col justify-between transition-all shadow-xs hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2E68FF] dark:text-[#5B8CFF]">
                    Quick Voice 1-1
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#2E68FF]" /> 115 Online
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1B1F2E] dark:text-white leading-snug">
                  ⚡ Ghép Đôi Luyện Nói 1-1 Ngẫu Nhiên
                </h3>
                <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1] leading-relaxed">
                  Ghép với bạn học rảnh trong 10-15 phút. Có thẻ AI gợi ý câu hỏi để không bao giờ bí từ.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartQuickMatch}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2E68FF] dark:hover:bg-[#2E68FF] text-slate-800 dark:text-slate-100 hover:text-white dark:hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all border border-slate-200 dark:border-slate-700 active:scale-95 group"
              >
                <Zap className="w-4 h-4 fill-slate-700 dark:fill-slate-300 group-hover:fill-white text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors shrink-0" />
                <span>Tìm Bạn Luyện Nói Ngay</span>
              </button>
            </div>

            {/* Public Game Night */}
            <div 
              onClick={() => {
                setPublicRoomsCategory('game');
                setActiveTab('public-rooms');
              }}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] space-y-3 flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
                    Sự Kiện Đêm
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#2E68FF]" /> 21:30 Tối Nay
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1B1F2E] dark:text-white leading-snug">
                  🎮 Sảnh Game Đêm: Taboo & Nối Từ
                </h3>
                <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1] leading-relaxed">
                  Trò chơi tiếng Anh tương tác có thưởng x2 điểm chuỗi nhóm do AI MC làm trọng tài.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPublicRoomsCategory('game');
                  setActiveTab('public-rooms');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2E68FF] dark:hover:bg-[#2E68FF] text-slate-800 dark:text-slate-100 hover:text-white dark:hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all border border-slate-200 dark:border-slate-700 active:scale-95 group"
              >
                <Gamepad2 className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors shrink-0" />
                <span className="truncate">Phòng Game ({publicRooms.filter(r => r.category === 'game').length})</span>
              </button>
            </div>

            {/* Daily Discussion */}
            <div 
              onClick={() => {
                setPublicRoomsCategory('discussion');
                setActiveTab('public-rooms');
              }}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] space-y-3 flex flex-col justify-between cursor-pointer transition-all shadow-xs hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-ping" /> Live Topic
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold shrink-0">28 Tham gia</span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#1B1F2E] dark:text-white leading-snug">
                  🗣️ Topic: "AI in Education"
                </h3>
                <p className="text-xs text-[#5A6478] dark:text-[#CBD5E1] leading-relaxed">
                  Luyện tư duy phản biện & từ vựng C1. Xin duyệt vào phòng call ngay.
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPublicRoomsCategory('discussion');
                  setActiveTab('public-rooms');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2E68FF] dark:hover:bg-[#2E68FF] text-slate-800 dark:text-slate-100 hover:text-white dark:hover:text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all border border-slate-200 dark:border-slate-700 active:scale-95 group"
              >
                <Mic className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors shrink-0" />
                <span className="truncate">Phòng Topic & Mic ({publicRooms.filter(r => r.category === 'discussion').length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FIND SQUADS */}
      {activeTab === 'squads' && (
        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#2E68FF]" />
                <span>Danh Sách Nhóm Tuyển Thành Viên</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Lọc nhóm theo mục tiêu, trình độ và lịch học.
              </p>
            </div>

            <div className="relative sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên nhóm..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-medium text-[#1B1F2E] dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-[#E4E8F0] dark:border-[#334155] overflow-x-auto scrollbar-none pb-1">
            <span className="text-xs font-bold text-slate-500 shrink-0">Mục tiêu:</span>
            {['All', 'IELTS 6.5+', 'Giao tiếp Pro', 'TOEIC 800+', 'English for Tech'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGoal(g)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedGoal === g
                    ? 'bg-[#2E68FF] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {g === 'All' ? 'Tất cả' : g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
            {filteredSquads.map((squad) => (
              <div
                key={squad.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 hover:border-[#2E68FF] transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={squad.avatar}
                        alt={squad.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white truncate">{squad.name}</h4>
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shrink-0">
                            {squad.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">Khởi xướng: <strong>{squad.creator}</strong></p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-500 flex items-center justify-end gap-1">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" /> {squad.streakDays}d
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                        {squad.membersCount}/{squad.maxMembers} người
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {squad.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-500">
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-[#2E68FF]">
                      🎯 {squad.targetGoal}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                      📊 {squad.level}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      ⏰ {squad.schedule}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    alert(`Đã gửi đơn xin gia nhập nhóm "${squad.name}"! Trưởng nhóm sẽ xem xét và phê duyệt trong phần Quản lý.`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#2E68FF] dark:hover:bg-[#2E68FF] text-slate-800 dark:text-slate-100 hover:text-white dark:hover:text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all border border-slate-200 dark:border-slate-700 group"
                >
                  <UserPlus className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors shrink-0" />
                  <span>Nộp Đơn Gia Nhập Nhóm</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SQUAD MANAGEMENT (QUẢN LÝ NHÓM CỦA TÔI) */}
      {activeTab === 'manage' && (
        <div className="space-y-4 sm:space-y-6">
          
          {/* SQUAD MANAGEMENT HEADER & SUB TABS */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs space-y-4 sm:space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 border-b border-[#E4E8F0] dark:border-[#334155] pb-4 sm:pb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base sm:text-xl shadow-md shrink-0">
                  SQ1
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-base sm:text-xl font-extrabold text-[#1B1F2E] dark:text-white truncate">
                      IELTS Band 7.5 Warriors 🚀
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-black flex items-center gap-1 border border-emerald-300 dark:border-emerald-800 shrink-0">
                      <ShieldCheck className="w-3 h-3" /> Quyền Bình Đẳng
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
                    Khởi xướng: <strong>Kỳ Duyên</strong> • Mục tiêu: <strong>IELTS 6.5+</strong> • <strong>4/5 người</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
                <span className="px-3 py-1.5 rounded-full bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-xs">
                  <Flame className="w-3.5 h-3.5 fill-white animate-bounce" /> 18d Streak
                </span>

                <button
                  type="button"
                  onClick={() => setIsCreateRoomOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Mở Phòng Call</span>
                </button>
              </div>
            </div>

            {/* EQUALITY & SELF-GOVERNANCE NOTICE */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#2E68FF] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-[#2E68FF] dark:text-blue-400">Nguyên tắc nhóm bình đẳng:</strong> Không phân biệt nhóm trưởng hay nhóm phó. Tất cả thành viên trong nhóm đều có <strong>quyền hạn hoàn toàn như nhau</strong> để phê duyệt ứng viên, chia sẻ tài liệu/video/flashcard, tạo bài tập nhóm và khởi xướng phòng call.
              </div>
            </div>

            {/* SUB TAB NAVIGATION */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <button
                type="button"
                onClick={() => setManageSubTab('overview')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shrink-0 ${
                  manageSubTab === 'overview'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Tổng Quan</span>
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab('resources')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shrink-0 relative ${
                  manageSubTab === 'resources'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kho Tài Liệu ({squadResources.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab('approvals')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shrink-0 relative ${
                  manageSubTab === 'approvals'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Phê Duyệt ({pendingApplicants.length})</span>
                {pendingApplicants.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full">
                    {pendingApplicants.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab('tasks')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shrink-0 ${
                  manageSubTab === 'tasks'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Nhiệm Vụ ({squadTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setManageSubTab('activity')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all text-center flex items-center justify-center gap-1.5 shrink-0 ${
                  manageSubTab === 'activity'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hoạt Động ({memberActivities.length})</span>
              </button>
            </div>

            {/* SUB TAB 1: OVERVIEW */}
            {manageSubTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                
                {/* Squad Quest Status */}
                <div className="p-5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider">
                      Tiến Độ Quest Hôm Nay
                    </span>
                    <span className="text-sm font-black text-[#2E68FF]">85%</span>
                  </div>
                  <div className="w-full h-3 bg-blue-200/50 dark:bg-blue-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full w-[85%]" />
                  </div>
                  <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
                    3/4 thành viên đã hoàn thành chuỗi bài học. Nhắc <strong>Hoàng Nam</strong> để giữ 18 ngày Streak!
                  </p>
                </div>

                {/* Member Count & Slot */}
                <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      Sĩ Số Thành Viên
                    </span>
                    <span className="text-sm font-black text-emerald-600">4 / 5 Người</span>
                  </div>
                  <div className="w-full h-3 bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[80%]" />
                  </div>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Còn trống 1 suất! Mọi thành viên đều có thể duyệt <strong>{pendingApplicants.length} đơn gia nhập</strong>.
                  </p>
                </div>

                {/* Next Live Room Session */}
                <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                      Buổi Luyện Nói Tiếp Theo
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      21:00 Tối Nay
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-purple-950 dark:text-purple-100">
                    Topic: Environment & Global Warming
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab('live-room')}
                    className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
                  >
                    Vào Sảnh Phòng Call
                  </button>
                </div>

              </div>
            )}

            {/* SUB TAB: SHARED RESOURCES (KHO TÀI LIỆU NHÓM CHUNG) */}
            {manageSubTab === 'resources' && (
              <div className="space-y-4 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#2E68FF]" />
                      <span>Kho Tài Liệu Chia Sẻ Chung ({squadResources.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bất kỳ thành viên nào cũng có thể chia sẻ Video, Flashcard, PDF hoặc Link học hay. Hệ thống sẽ tự động tạo bài tập ôn tập chung!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddResourceOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Chia Sẻ Tài Liệu Mới</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {squadResources.map((res) => (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between hover:border-[#2E68FF]/50 transition-all shadow-xs"
                    >
                      <div className="space-y-3">
                        {/* PROMINENT SHARER INFO BAR */}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700/60 shadow-2xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2E68FF] to-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                              {res.uploadedByAvatar || res.uploadedBy.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-extrabold text-[#1B1F2E] dark:text-white truncate">
                                  {res.uploadedBy}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[#2E68FF] dark:text-blue-400 text-[9px] font-black shrink-0">
                                  {res.uploadedByRole || 'Thành viên'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                Đã chia sẻ • {res.uploadedAt}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 uppercase shrink-0 ${
                            res.type === 'course'
                              ? 'bg-blue-100 dark:bg-blue-950 text-[#2E68FF] dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                              : res.type === 'video'
                              ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400'
                              : res.type === 'flashcard'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : res.type === 'document'
                              ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400'
                              : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                          }`}>
                            {res.type === 'course' && <GraduationCap className="w-3 h-3" />}
                            {res.type === 'video' && <Video className="w-3 h-3" />}
                            {res.type === 'flashcard' && <Layers className="w-3 h-3" />}
                            {res.type === 'document' && <FileText className="w-3 h-3" />}
                            {res.type === 'link' && <ExternalLink className="w-3 h-3" />}
                            {res.type === 'course' ? 'Khóa Học' : res.type === 'video' ? 'Video' : res.type === 'flashcard' ? 'Flashcard' : res.type === 'document' ? 'PDF' : 'Link'}
                          </span>
                        </div>

                        {/* Course Thumbnail Preview if system course */}
                        {res.type === 'course' && res.systemMeta?.thumbnailUrl && (
                          <div className="relative w-full h-32 rounded-xl overflow-hidden mb-1 border border-slate-200 dark:border-slate-800 group">
                            <img
                              src={res.systemMeta.thumbnailUrl}
                              alt={res.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-[10px] flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" /> {res.systemMeta.lessonsCount || 3} Bài Học Hệ Thống
                              </span>
                            </div>
                          </div>
                        )}

                        <h4 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white leading-snug">
                          {res.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {res.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {res.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                        {/* Interactive button based on resource type */}
                        {res.type === 'course' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectCourse) {
                                onSelectCourse(res.courseId || 'c1');
                              } else {
                                alert(`🎓 Mở khóa học: ${res.title}`);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#2E68FF] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Mở Khóa Học Ngay</span>
                          </button>
                        ) : res.type === 'flashcard' && res.flashcardDeckId ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenFlashcards) {
                                onOpenFlashcards();
                              } else {
                                alert('🎴 Chuyển sang giao diện Flashcard SRS');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Layers className="w-3.5 h-3.5" />
                            <span>Học Flashcard SRS</span>
                          </button>
                        ) : (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Mở Link Tài Liệu</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleGenerateTasksFromResource(res)}
                          className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center gap-1.5 transition-colors shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>🤖 AI Tạo Bài Tập Ôn Nhóm</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB TAB 2: MEMBER APPROVALS */}
            {manageSubTab === 'approvals' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#2E68FF]" />
                    <span>Danh Sách Đơn Xin Gia Nhập Nhóm ({pendingApplicants.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500">Xem xét trình độ, mục tiêu và lời nhắn gửi từ ứng viên</span>
                </div>

                {pendingApplicants.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-dashed border-slate-300 dark:border-slate-800 space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-extrabold text-sm text-[#1B1F2E] dark:text-white">Không có đơn xin gia nhập nào đang chờ duyệt</p>
                    <p className="text-xs text-slate-400">Các thành viên mới nộp đơn sẽ xuất hiện tại đây.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={applicant.avatar}
                            alt={applicant.name}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white dark:border-slate-800 shadow-xs"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white">{applicant.name}</h4>
                              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#2E68FF] text-[10px] font-bold">
                                {applicant.targetGoal}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                Trình độ: {applicant.level}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#1E293B] p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                              "{applicant.note}"
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-400">
                              <span>Lịch sử Streak cá nhân: <strong className="text-amber-500">{applicant.streakHistory} ngày</strong></span>
                              <span>• Nộp đơn {applicant.appliedDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDeclineMember(applicant.id)}
                            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            <UserX className="w-4 h-4 text-slate-500" />
                            <span>Từ Chối</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveMember(applicant)}
                            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Đồng Ý Gia Nhập</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB TAB 3: SQUAD TASKS & DAILY QUESTS */}
            {manageSubTab === 'tasks' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#2E68FF]" />
                      <span>Nhiệm Vụ Đồng Đội Hàng Ngày (Squad Quests)</span>
                    </h3>
                    <p className="text-xs text-slate-500">Mỗi cá nhân hoàn thành nhiệm vụ để đóng góp % tích điểm chuỗi nhóm</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddTaskOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Nhiệm Vụ Mới</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {squadTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            task.isUserCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E293B]'
                          }`}
                        >
                          {task.isUserCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div>
                          <h4 className={`font-extrabold text-xs text-[#1B1F2E] dark:text-white ${
                            task.isUserCompleted ? 'line-through opacity-75' : ''
                          }`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="px-2 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                              {task.category}
                            </span>
                            <span>+ {task.points} Pts thưởng</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <span className="text-xs font-black text-[#2E68FF]">
                            {task.completedMembersCount} / {task.totalMembersCount} Hoàn thành
                          </span>
                          <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${(task.completedMembersCount / task.totalMembersCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB TAB 4: MEMBER ACTIVITY TRACKING & ATTENDANCE */}
            {manageSubTab === 'activity' && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2E68FF]" />
                      <span>Bảng Theo Dõi Hoạt Động & Điểm Danh Chi Tiết</span>
                    </h3>
                    <p className="text-xs text-slate-500">Giám sát thời gian học, số bài tập hoàn thành và trạng thái của từng người</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Thành viên</th>
                        <th className="py-3 px-3">Điểm danh hôm nay</th>
                        <th className="py-3 px-3">Thì giờ học</th>
                        <th className="py-3 px-3">Nhiệm vụ</th>
                        <th className="py-3 px-3">Chuỗi Streak</th>
                        <th className="py-3 px-3">Lần cuối online</th>
                        <th className="py-3 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {memberActivities.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-[#0F172A] transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {m.avatar}
                              </div>
                              <div>
                                <p className="font-bold text-[#1B1F2E] dark:text-white">{m.name}</p>
                                <span className="text-[10px] text-slate-400">{m.role}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {m.status === 'active' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-[11px] inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Đã điểm danh
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 font-bold text-[11px] inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Chưa học
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 font-extrabold text-[#1B1F2E] dark:text-white">
                            {m.studyMinutesToday} phút
                          </td>

                          <td className="py-3 px-3 font-bold text-[#2E68FF]">
                            {m.tasksCompleted} / {m.totalTasks} Done
                          </td>

                          <td className="py-3 px-3 font-extrabold text-amber-500">
                            🔥 {m.streakDays} ngày
                          </td>

                          <td className="py-3 px-3 text-slate-400 font-medium">
                            {m.lastActive}
                          </td>

                          <td className="py-3 px-3 text-right">
                            {m.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => alert(`Đã gửi thông báo nhắc nhở điểm danh đến ${m.name} qua tin nhắn nhóm!`)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] shadow-2xs transition-colors"
                              >
                                🔔 Nhắc Học Tập
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* TAB 4: LIVE STUDY ROOMS */}
      {activeTab === 'live-room' && (
        <div className="space-y-6">
          
          {/* PHASE 1: LOBBY MODE (SẢNH CHỜ TRƯỚC KHI BẬT CALL) */}
          {!isLiveCallActive ? (
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 space-y-6 animate-in fade-in duration-300">
              
              {/* Lobby Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Sảnh Chờ Phòng Call (Lobby)
                    </span>
                    <span className="text-xs text-slate-400 font-bold">• Trạng thái: Chưa Bật Call</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1.5">
                    {activeRoomTitle}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Chủ đề hiện tại: <strong className="text-purple-300">{customLobbyTopic}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCreateRoomOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo Phòng Khác</span>
                  </button>
                </div>
              </div>

              {/* Lobby Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (7 cols): Topic & Game Setup Panel */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Panel 1: Setup Topic */}
                  <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Thiết Lập Chủ Đề Thảo Luận Ban Đầu</span>
                      </h4>
                      <span className="text-[11px] text-purple-300 font-bold">AI MC Ready 🤖</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customLobbyTopic}
                        onChange={(e) => setCustomLobbyTopic(e.target.value)}
                        placeholder="Nhập hoặc đổi chủ đề thảo luận..."
                        className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateNewAiTopic}
                        disabled={isGeneratingAiTopic}
                        className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shrink-0 flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAiTopic ? 'animate-spin' : ''}`} />
                        <span>Xác Nhận & Sinh Thẻ AI</span>
                      </button>
                    </div>

                    {/* Quick topic presets */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-bold mr-1">Gợi ý nhanh:</span>
                      {[
                        'Topic Environment & Climate Change',
                        'Technology & Artificial Intelligence',
                        'Travel Memories & Culture',
                        'Work-Life Balance'
                      ].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCustomLobbyTopic(t)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            customLobbyTopic === t
                              ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                              : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel 2: Select 1 of 3 Call Modes */}
                  <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Gamepad2 className="w-4 h-4 text-amber-400" />
                        <span>Chế Độ Hoạt Động Trong Call (Chọn 1 Trong 3)</span>
                      </h4>
                      <span className="text-xs text-purple-300 font-bold">Chế độ: {activeGame === 'topic' ? 'Nói theo chủ đề' : activeGame === 'word-chain' ? 'Nối từ tiếng Anh' : 'Đoán từ Taboo'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Mode 1: Topic Discussion */}
                      <button
                        type="button"
                        onClick={() => setActiveGame('topic')}
                        className={`p-3.5 rounded-xl text-xs text-left border transition-all space-y-1.5 relative ${
                          activeGame === 'topic'
                            ? 'bg-purple-500/20 border-purple-500 ring-2 ring-purple-500/40 text-purple-300 font-extrabold'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {activeGame === 'topic' && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500 text-white font-black text-[9px]">
                            ĐÃ CHỌN
                          </span>
                        )}
                        <p className="font-extrabold text-sm">💬 Nói Chuyện Theo Chủ Đề</p>
                        <p className="text-[11px] text-slate-400 font-normal leading-snug">
                          Thảo luận IELTS/Giao tiếp. AI MC gợi ý từ vựng & sửa lỗi trực tiếp.
                        </p>
                      </button>

                      {/* Mode 2: Word Chain */}
                      <button
                        type="button"
                        onClick={() => setActiveGame('word-chain')}
                        className={`p-3.5 rounded-xl text-xs text-left border transition-all space-y-1.5 relative ${
                          activeGame === 'word-chain'
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 text-amber-300 font-extrabold'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {activeGame === 'word-chain' && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black text-[9px]">
                            ĐÃ CHỌN
                          </span>
                        )}
                        <p className="font-extrabold text-sm">🔤 Nối Từ Tiếng Anh</p>
                        <p className="text-[11px] text-slate-400 font-normal leading-snug">
                          Nối chữ cái cuối của từ trước. Luyện vốn từ cực nhanh (+15 Pts/từ).
                        </p>
                      </button>

                      {/* Mode 3: Taboo */}
                      <button
                        type="button"
                        onClick={() => setActiveGame('taboo')}
                        className={`p-3.5 rounded-xl text-xs text-left border transition-all space-y-1.5 relative ${
                          activeGame === 'taboo'
                            ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/40 text-emerald-300 font-extrabold'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {activeGame === 'taboo' && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px]">
                            ĐÃ CHỌN
                          </span>
                        )}
                        <p className="font-extrabold text-sm">🤫 Game Đoán Từ Taboo</p>
                        <p className="text-[11px] text-slate-400 font-normal leading-snug">
                          Mô tả từ bí mật mà KHÔNG dùng từ cấm. Rèn phản xạ giải thích (+25 Pts).
                        </p>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column (5 cols): Lobby Participants & Sound Test */}
                <div className="lg:col-span-5 space-y-5">
                  
                  {/* Lobby Members List */}
                  <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Thành Viên Ở Sảnh Chờ (3/4)</span>
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                        Chờ Bạn Bật Call
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { name: 'Kỳ Duyên (Bạn - Host)', role: 'Người khởi xướng', avatar: 'KD', isAi: false },
                        { name: 'Minh Trí', role: 'Thành viên Squad', avatar: 'MT', isAi: false },
                        { name: 'Bảo Ngọc', role: 'Thành viên Squad', avatar: 'BN', isAi: false },
                        { name: 'AI MC Assistant 🤖', role: 'Trợ lý AI Đồng Hành', avatar: 'AI', isAi: true }
                      ].map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${
                              m.isAi ? 'bg-purple-600 text-white border-purple-400' : 'bg-blue-600 text-white border-blue-400'
                            }`}>
                              {m.avatar}
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-white">{m.name}</h5>
                              <p className="text-[10px] text-slate-400">{m.role}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sẵn sàng
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Test Mic Box */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-blue-400" />
                          Kiểm tra Micro & Âm thanh
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMicTesting(!isMicTesting)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            isMicTesting
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {isMicTesting ? '🎙️ Đang Test Mic (Tốt)' : 'Thử Mic Ban Đầu'}
                        </button>
                      </div>

                      {isMicTesting && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="w-2 h-4 rounded bg-emerald-500 animate-pulse" />
                          <div className="w-2 h-6 rounded bg-emerald-500 animate-pulse delay-75" />
                          <div className="w-2 h-8 rounded bg-emerald-500 animate-pulse delay-100" />
                          <div className="w-2 h-5 rounded bg-emerald-500 animate-pulse delay-150" />
                          <span className="text-[10px] text-emerald-400 font-bold ml-2">
                            Tín hiệu âm thanh bình thường!
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                </div>

              </div>

              {/* GIANT CALL CTA BUTTON */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsLiveCallActive(true)}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 hover:from-emerald-600 hover:to-purple-700 text-white font-black text-base flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-transform active:scale-98 mx-auto"
                >
                  <PhoneCall className="w-6 h-6 animate-bounce" />
                  <span>BẬT MIC & THAM GIA CALL NGAY</span>
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Bấm nút trên để bắt đầu cuộc gọi thoại trực tiếp cùng các bạn học & Trợ lý AI MC!
                </p>
              </div>

            </div>
          ) : (
            
            /* PHASE 2: ACTIVE CALL MODE (ĐANG TRONG CUỘC GỌI MỞ MIC THẬT) */
            <div className={
              isCallMaximized
                ? "fixed inset-0 z-[100] p-4 sm:p-8 bg-slate-950/98 text-white shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-start backdrop-blur-2xl animate-in zoom-in-95 duration-200"
                : "p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border border-slate-800 space-y-6 animate-in fade-in duration-300"
            }>
              
              {/* Active Call Header & Top Live Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-red-600/30 shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>LIVE 🔴 08:24</span>
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white flex items-center gap-2">
                      <span>{activeRoomTitle}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/30 font-bold">
                        AI MC Active 🤖
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Đang thảo luận: <strong className="text-emerald-400">{customLobbyTopic}</strong>
                    </p>
                  </div>
                </div>

                {/* Main Call Action Bar */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setMicOn(!micOn)}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-colors border ${
                      micOn
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-red-500/20 border-red-500 text-red-300'
                    }`}
                  >
                    {micOn ? <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />}
                    <span>{micOn ? 'Mic: Bật' : 'Mic: Tắt'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCamOn(!camOn)}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-colors border ${
                      camOn
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {camOn ? <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" /> : <VideoOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />}
                    <span>{camOn ? 'Cam: Bật' : 'Cam: Tắt'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHandRaised(!handRaised)}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-colors border ${
                      handRaised
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Hand className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{handRaised ? 'Giơ Tay ✋' : 'Giơ Tay'}</span>
                  </button>

                  {/* Toggle Fullscreen / Expand Mode */}
                  <button
                    type="button"
                    onClick={() => setIsCallMaximized(!isCallMaximized)}
                    className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-all border ${
                      isCallMaximized
                        ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/50'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    }`}
                    title={isCallMaximized ? "Thu nhỏ giao diện cuộc gọi" : "Phóng to toàn màn hình cuộc gọi"}
                  >
                    {isCallMaximized ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-300" />}
                    <span>{isCallMaximized ? 'Thu Nhỏ' : 'Phóng To'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinishCallAndSummarize}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 shadow-lg shadow-red-600/30 transition-all active:scale-95"
                  >
                    <PhoneCall className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-135 shrink-0" />
                    <span>Rời Call <span className="hidden sm:inline">& Nhận Tóm Tắt AI</span></span>
                  </button>
                </div>
              </div>

              {/* Voice / Video Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: 'Kỳ Duyên (Bạn)', isTalking: micOn, avatar: 'KD', hand: handRaised, isAi: false },
                  { name: 'Minh Trí', isTalking: true, avatar: 'MT', hand: false, isAi: false },
                  { name: 'Bảo Ngọc', isTalking: false, avatar: 'BN', hand: false, isAi: false },
                  { name: 'AI MC Assistant 🤖', isTalking: true, avatar: 'AI', hand: false, isAi: true }
                ].map((m, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all text-center space-y-2 relative ${
                      m.isTalking
                        ? 'bg-purple-950/70 border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/50'
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    {m.hand && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[10px] animate-bounce">
                        ✋ Xin phát biểu
                      </span>
                    )}

                    <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center font-black text-base border-2 shadow-md ${
                      m.isAi ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white border-purple-400' : 'bg-blue-600 text-white border-blue-400'
                    }`}>
                      {m.avatar}
                    </div>

                    <div>
                      <h5 className="font-bold text-xs text-white truncate">{m.name}</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {m.isTalking ? (
                          <span className="text-emerald-400 font-bold flex items-center justify-center gap-1">
                            <Volume2 className="w-3 h-3 animate-bounce" /> Đang phát biểu...
                          </span>
                        ) : (
                          'Đang lắng nghe'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Mode Section (3 distinct modes) */}
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4">
                
                {/* 3-Mode Tab Switcher Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4 text-amber-400" />
                    <h4 className="font-extrabold text-sm text-white">Chế Độ Hoạt Động Call</h4>
                  </div>

                  {/* 3-Option Tab Switcher */}
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-700 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveGame('topic')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                        activeGame === 'topic' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>💬 Nói Theo Chủ Đề</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGame('word-chain')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                        activeGame === 'word-chain' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🔤 Nối Từ Tiếng Anh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveGame('taboo')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
                        activeGame === 'taboo' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>🤫 Đoán Từ Taboo</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: Nói chuyện theo chủ đề (Topic Discussion) */}
                {activeGame === 'topic' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-400" />
                        <span className="font-extrabold text-xs text-purple-300 uppercase tracking-wider">
                          Thẻ Gợi Ý Thảo Luận IELTS & Giao Tiếp
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleGenerateNewAiTopic}
                        disabled={isGeneratingAiTopic}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAiTopic ? 'animate-spin' : ''}`} />
                        <span>Sinh Thẻ AI Mới</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {aiTopicCards.map((card, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs text-slate-200 leading-relaxed space-y-1">
                          <span className="text-[10px] text-purple-400 font-extrabold uppercase">Thẻ Gợi Ý #{i + 1}</span>
                          <p>{card}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MODE 2: Nối từ tiếng Anh (Word Chain Game) */}
                {activeGame === 'word-chain' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-bold">Trò chơi: Nối Từ Tiếng Anh (Word Chain)</span>
                      <span className="text-amber-400 font-extrabold">Điểm tích lũy: +{gameScore} Pts</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span>Lượt chơi hiện tại: <strong className="text-amber-400">{activeTurnPlayer}</strong></span>
                        <span>Bắt đầu bằng chữ cái: <strong className="text-emerald-400 text-base font-black uppercase">{wordChainHistory[wordChainHistory.length - 1].slice(-1)}</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 font-bold">Chuỗi từ đã nối:</span>
                        {wordChainHistory.map((w, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded bg-slate-800 text-white font-bold text-[11px] border border-slate-700">
                            {w} {idx < wordChainHistory.length - 1 ? '➔' : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleWordChainSubmit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={wordChainInput}
                        onChange={(e) => setWordChainInput(e.target.value)}
                        placeholder={`Nhập từ tiếng Anh bắt đầu bằng chữ '${wordChainHistory[wordChainHistory.length - 1].slice(-1)}'...`}
                        className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white uppercase focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shrink-0 transition-colors"
                      >
                        Gửi Từ Nối (+15 Pts)
                      </button>
                    </form>
                  </div>
                )}

                {/* MODE 3: Game Đoán từ Taboo */}
                {activeGame === 'taboo' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300 font-bold">Trò chơi: Đoán Từ Taboo (Taboo Word Game)</span>
                      <span className="text-emerald-400 font-extrabold">Điểm tích lũy: +{gameScore} Pts</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-2">
                      <div className="flex justify-between items-center text-amber-400 font-bold">
                        <span>Từ bí mật cần mô tả bằng tiếng Anh: <strong className="text-white underline text-sm">TELESCOPE</strong></span>
                        <span className="text-emerald-400 font-bold">+25 Pts</span>
                      </div>
                      <p className="text-[11px] text-red-400 font-bold">
                        ⚠️ Các từ CẤM KHÔNG ĐƯỢC NÓI HOẶC VIẾT: <span className="text-slate-300 font-normal">Star, Space, See, Night, Glass</span>
                      </p>
                    </div>

                    <form onSubmit={handleTabooSubmit} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tabooGuessInput}
                        onChange={(e) => setTabooGuessInput(e.target.value)}
                        placeholder="Nhập câu trả lời/từ đoán của bạn (VD: Telescope)..."
                        className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shrink-0 transition-colors"
                      >
                        Gửi Đoán Từ (+25 Pts)
                      </button>
                    </form>

                    {tabooFeedback && (
                      <p className="text-xs font-bold text-amber-300 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        {tabooFeedback}
                      </p>
                    )}
                  </div>
                )}

              </div>

              {/* AI Summary Box */}
              {aiSummary && (
                <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs leading-relaxed space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Bản Nhận Xét & Tóm Tắt Buổi Học Từ AI MC:</span>
                  </div>
                  <p className="whitespace-pre-wrap font-sans text-emerald-100">{aiSummary}</p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* TAB 5: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] space-y-5">
          <div>
            <h2 className="text-xl font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              <span>Bảng Xếp Hạng Chuỗi Học Nhóm (Squad Streaks)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tích điểm thưởng, giữ chuỗi ngày học đồng đội để mở khóa huy hiệu vinh danh hàng tuần.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { rank: 1, name: 'Tech & AI Talkers 🤖', streak: '24 Ngày Streak 🔥', points: '3,850 Pts', members: '5/6', badge: '🥇 Khối Kim Cương' },
              { rank: 2, name: 'IELTS Band 7.5 Warriors 🚀', streak: '18 Ngày Streak 🔥', points: '2,920 Pts', members: '4/5', badge: '🥈 Khối Bạch Kim' },
              { rank: 3, name: 'Giao Tiếp Tự Tin 100% ☕', streak: '12 Ngày Streak 🔥', points: '1,840 Pts', members: '3/4', badge: '🥉 Khối Vàng' },
              { rank: 4, name: 'TOEIC 850+ Chinh Phục 🎯', streak: '9 Ngày Streak 🔥', points: '1,200 Pts', members: '3/5', badge: 'Khối Bạc' },
            ].map((item) => (
              <div
                key={item.rank}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full font-black text-sm flex items-center justify-center shrink-0 ${
                    item.rank === 1 ? 'bg-amber-500 text-white' : item.rank === 2 ? 'bg-slate-300 text-slate-800' : 'bg-amber-700 text-white'
                  }`}>
                    {item.rank}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-[#1B1F2E] dark:text-white">{item.name}</h4>
                    <p className="text-xs text-slate-500">{item.members} thành viên • {item.badge}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-black text-amber-500">{item.streak}</p>
                  <p className="text-[11px] font-bold text-[#2E68FF]">{item.points}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PUBLIC ROOMS DIRECTORY (SIDE-BY-SIDE WITH SIDEBAR) */}
      {activeTab === 'public-rooms' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm animate-in fade-in duration-200">
          
          {/* HEADER WITH BACK TO LOBBY BUTTON */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab('plaza')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#2E68FF]" />
                <span>Quay lại Sảnh</span>
              </button>

              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-ping text-emerald-500" />
                <span>{publicRooms.length} Phòng Public Đang Live</span>
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPublicRoomsCategory('all')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  publicRoomsCategory === 'all'
                    ? 'bg-[#2E68FF] text-white shadow-md'
                    : 'bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Tất Cả Phòng ({publicRooms.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPublicRoomsCategory('game')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  publicRoomsCategory === 'game'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>🎮 Phòng Game Nhóm ({publicRooms.filter(r => r.category === 'game').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setPublicRoomsCategory('discussion')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                  publicRoomsCategory === 'discussion'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-[#0F172A] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>🗣️ Phòng Tranh Luận Topic ({publicRooms.filter(r => r.category === 'discussion').length})</span>
              </button>
            </div>
          </div>

            {/* LIST OF PUBLIC ROOMS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicRooms
                .filter(room => publicRoomsCategory === 'all' || room.category === publicRoomsCategory)
                .map((room) => {
                  const isFull = room.activeParticipants >= room.maxParticipants;
                  return (
                    <div
                      key={room.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-600 transition-all space-y-4 flex flex-col justify-between shadow-2xs hover:shadow-md"
                    >
                      <div className="space-y-3">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            room.category === 'game'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40'
                          }`}>
                            {room.category === 'game' ? <Gamepad2 className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                            {room.category === 'game' ? '🎮 Game Room' : '🗣️ Discussion'}
                          </span>

                          <span className={`text-[11px] font-extrabold flex items-center gap-1 px-2 py-0.5 rounded-full ${
                            isFull ? 'bg-red-100 dark:bg-red-950/80 text-red-600' : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            <Users className="w-3.5 h-3.5" />
                            {room.activeParticipants}/{room.maxParticipants} {isFull ? '(Full)' : 'Sẵn Sàng'}
                          </span>
                        </div>

                        {/* Title & Host Info */}
                        <div>
                          <h4 className="font-extrabold text-base text-[#1B1F2E] dark:text-white leading-snug">
                            {room.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                            <span>Chủ phòng:</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-bold">{room.hostName}</strong>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black">{room.level}</span>
                          </p>
                        </div>

                        {/* Topic Tag */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                          <Volume2 className="w-4 h-4 text-[#2E68FF] shrink-0 mt-0.5" />
                          <span className="font-semibold">{room.topic}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {room.requestStatus === 'idle' && (
                          <button
                            type="button"
                            disabled={isFull}
                            onClick={() => handleRequestJoinPublicRoom(room.id)}
                            className={`w-full py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 group ${
                              isFull
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-[#2E68FF] dark:hover:bg-[#2E68FF] text-slate-800 dark:text-slate-100 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 cursor-pointer'
                            }`}
                          >
                            <UserPlus className={`w-4 h-4 ${isFull ? '' : 'text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors'}`} />
                            <span>{isFull ? 'Phòng Đã Đầy' : 'Yêu Cầu Tham Gia Call'}</span>
                          </button>
                        )}

                        {room.requestStatus === 'pending' && (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300/50 font-black text-xs flex items-center justify-center gap-2 cursor-wait"
                          >
                            <Clock className="w-4 h-4 animate-spin text-amber-500" />
                            <span>⏳ Đang Chờ Chủ Phòng Duyệt...</span>
                          </button>
                        )}

                        {room.requestStatus === 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleEnterApprovedPublicRoom(room)}
                            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 animate-pulse"
                          >
                            <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            <span>🎉 Chủ Phòng Đã Duyệt - Vào Phòng Ngay!</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
        </div>
      )}
        </main>
      </div>

      {/* MODAL: QUICK MATCHING */}
      {isMatchingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6 text-center relative">
            <button
              type="button"
              onClick={() => setIsMatchingModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {matchingStatus === 'searching' ? (
              <div className="space-y-6 py-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-500 flex items-center justify-center mx-auto relative">
                  <Zap className="w-10 h-10 fill-amber-500 animate-bounce" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-[#1B1F2E] dark:text-white">
                    Đang tìm bạn học luyện nói phù hợp...
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Hệ thống đang ghép cặp bạn với người dùng cùng trình độ B1-B2 rảnh trong 15 phút.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    Đã ghép cặp thành công 🎉
                  </span>
                  <h3 className="font-extrabold text-lg text-[#1B1F2E] dark:text-white mt-2">
                    {matchedPartner?.name}
                  </h3>
                  <p className="text-xs text-[#2E68FF] font-bold">{matchedPartner?.level}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F172A] text-xs text-left text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-bold text-[#1B1F2E] dark:text-white">💡 Chủ đề gợi ý luyện nói (10 phút):</p>
                  <p>{matchedPartner?.topic}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMatchingModalOpen(false);
                    setActiveTab('live-room');
                    setIsLiveCallActive(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#2E68FF] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Vào Phòng Gọi Nối Mic Ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE SQUAD */}
      {isCreateSquadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateSquad} className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsCreateSquadOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-extrabold text-lg text-[#1B1F2E] dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2E68FF]" />
                <span>Tạo Nhóm Học Squad Tự Quản (3-6 Người)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tạo nhóm nhỏ kỷ luật để giữ chuỗi ngày học cùng nhau.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Nhóm Học Squad
                </label>
                <input
                  type="text"
                  required
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  placeholder="VD: IELTS Band 7.5 Speaking Masters 🚀"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mục Tiêu Nhóm
                  </label>
                  <select
                    value={newSquadGoal}
                    onChange={(e) => setNewSquadGoal(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                  >
                    <option value="IELTS 6.5+">IELTS 6.5+</option>
                    <option value="Giao tiếp Pro">Giao tiếp Pro</option>
                    <option value="TOEIC 800+">TOEIC 800+</option>
                    <option value="English for Tech">English for Tech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Khung Giờ Sinh Hoạt
                  </label>
                  <input
                    type="text"
                    value={newSquadSchedule}
                    onChange={(e) => setNewSquadSchedule(e.target.value)}
                    placeholder="VD: 21:00 - 22:00 Mỗi tối"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateSquadOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
              >
                Tạo Nhóm Ngay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE LIVE STUDY ROOM */}
      {isCreateRoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateLiveRoom} className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 relative">
            <button
              type="button"
              onClick={() => setIsCreateRoomOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-extrabold text-lg text-[#1B1F2E] dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#2E68FF]" />
                <span>Tạo Phòng Học Group Call Mới</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tạo phòng call riêng cho nhóm hoặc phòng công khai tích hợp Trợ lý AI MC.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên Phòng Học
                </label>
                <input
                  type="text"
                  required
                  value={newRoomTitle}
                  onChange={(e) => setNewRoomTitle(e.target.value)}
                  placeholder="VD: Phòng Speaking Task 2 - Topic Technology"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chủ Đề Thảo Luận Ban Đầu
                </label>
                <input
                  type="text"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  placeholder="VD: Artificial Intelligence & Future Jobs"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chế Độ Hoạt Động Ban Đầu (Chọn 1 Trong 3)
                </label>
                <select
                  value={selectedRoomActivity}
                  onChange={(e: any) => setSelectedRoomActivity(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                >
                  <option value="topic">💬 1. Nói chuyện theo chủ đề (Thảo luận AI MC)</option>
                  <option value="word-chain">🔤 2. Nối từ tiếng Anh (Game Word Chain)</option>
                  <option value="taboo">🤫 3. Đoán từ Taboo (Game Taboo Words)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-[#334155] mb-1">
                    Chế Độ Phòng
                  </label>
                  <select
                    value={newRoomMode}
                    onChange={(e: any) => setNewRoomMode(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                  >
                    <option value="Squad Only">Chỉ dành cho Squad</option>
                    <option value="Public">Công khai (Sảnh Chung)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Loại Cuộc Gọi
                  </label>
                  <select
                    value={newRoomType}
                    onChange={(e: any) => setNewRoomType(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                  >
                    <option value="Voice Call">Voice Call (Âm thanh)</option>
                    <option value="Video Call">Video Call (Cam & Âm thanh)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateRoomOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
              >
                Mở Phòng Call Ngay
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD RESOURCE (CHIA SẺ TÀI LIỆU CÔNG KHAI TRONG NHÓM) */}
      {isAddResourceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleCreateResource} className="bg-white dark:bg-[#1E293B] w-full max-w-xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsAddResourceOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-extrabold text-lg text-[#1B1F2E] dark:text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#2E68FF]" />
                <span>Chia Sẻ Học Liệu Vào Kho Nhóm</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Chia sẻ trực tiếp Khóa Học, Bộ Flashcard trong hệ thống hoặc tải lên link tài liệu ngoài cho nhóm.
              </p>
            </div>

            {/* SHARER IDENTITY BANNER */}
            <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2E68FF] to-indigo-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                KD
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-extrabold text-[#1B1F2E] dark:text-white flex items-center gap-2">
                  <span>Kỳ Duyên (Bạn)</span>
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/80 text-[#2E68FF] dark:text-blue-300 text-[10px] font-black rounded-md">
                    Thành viên nhóm
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Hệ thống sẽ ghi nhận bạn là Người chia sẻ khóa học/học liệu này cho các thành viên.
                </p>
              </div>
            </div>

            {/* SOURCE MODE SWITCHER */}
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setResourceSourceMode('system')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  resourceSourceMode === 'system'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-[#2E68FF]" />
                <span>Khóa Học & Flashcard Hệ Thống</span>
              </button>

              <button
                type="button"
                onClick={() => setResourceSourceMode('custom')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  resourceSourceMode === 'custom'
                    ? 'bg-white dark:bg-[#1E293B] text-[#2E68FF] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ExternalLink className="w-4 h-4 text-purple-600" />
                <span>Link / Video / Ebook Tự Nhập</span>
              </button>
            </div>

            {/* MODE 1: SYSTEM ITEMS */}
            {resourceSourceMode === 'system' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSystemItemType('course')}
                    className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedSystemItemType === 'course'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-[#2E68FF] text-[#2E68FF]'
                        : 'bg-slate-50 dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Khóa Học AI ({INITIAL_COURSES.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSystemItemType('flashcard')}
                    className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      selectedSystemItemType === 'flashcard'
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-600 dark:text-amber-400'
                        : 'bg-slate-50 dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Bộ Flashcards SRS</span>
                  </button>
                </div>

                {selectedSystemItemType === 'course' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Chọn Khóa Học Trên Hệ Thống Để Chia Sẻ:
                    </label>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {INITIAL_COURSES.map((course) => {
                        const isSelected = selectedSystemCourseId === course.id;
                        return (
                          <div
                            key={course.id}
                            onClick={() => setSelectedSystemCourseId(course.id)}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-blue-50 dark:bg-blue-950/70 border-[#2E68FF] shadow-xs'
                                : 'bg-slate-50 dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={course.thumbnailUrl}
                                alt={course.title}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div>
                                <h4 className="font-extrabold text-xs text-[#1B1F2E] dark:text-white line-clamp-1">
                                  {course.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {course.category} • {course.lessons.length} Bài học • ⭐ {course.rating}
                                </p>
                              </div>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-[#2E68FF] shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-600" />
                        Bộ Flashcard 100 Từ Vựng Web Dev & English Tech
                      </span>
                      <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-[10px] font-black rounded-md">
                        15 thẻ SRS
                      </span>
                    </div>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                      Chia sẻ bộ thẻ này vào kho nhóm giúp toàn bộ thành viên có thể cùng nhau lặp lại ngắt quãng (SRS), thuộc từ vựng siêu tốc và thi đua streak daily!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: CUSTOM EXTERNAL ITEM */}
            {resourceSourceMode === 'custom' && (
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tiêu Đề Tài Liệu / Link / Video
                  </label>
                  <input
                    type="text"
                    required={resourceSourceMode === 'custom'}
                    value={newResTitle}
                    onChange={(e) => setNewResTitle(e.target.value)}
                    placeholder="VD: 🎥 Video 15 Phút IELTS Speaking Part 2 - Band 8.0"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Loại Học Liệu
                    </label>
                    <select
                      value={newResType}
                      onChange={(e: any) => setNewResType(e.target.value)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-[#1B1F2E] dark:text-white"
                    >
                      <option value="video">🎥 Video (YouTube / Drive)</option>
                      <option value="flashcard">🎴 Thẻ Flashcard</option>
                      <option value="document">📄 Ebook / PDF / Docs</option>
                      <option value="link">🔗 Đường Link Bài Báo Hay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Đường Link TRUY CẬP (URL)
                    </label>
                    <input
                      type="text"
                      value={newResUrl}
                      onChange={(e) => setNewResUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mô Tả Nội Dung & Ghi Chú Ôn Tập
                  </label>
                  <textarea
                    rows={2}
                    value={newResDesc}
                    onChange={(e) => setNewResDesc(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn nội dung tài liệu để các bạn cùng nhóm dễ tiếp cận..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thẻ Tương Tác (Gắn Nhãn, cách nhau bởi dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={newResTags}
                    onChange={(e) => setNewResTags(e.target.value)}
                    placeholder="IELTS, Speaking, Part2, Vocab"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-xs text-[#1B1F2E] dark:text-white font-semibold"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddResourceOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Chia Sẻ & Tạo Bài Tập AI</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
