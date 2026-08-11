import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Folder,
  FolderPlus,
  Plus,
  Layers,
  Globe,
  Lock,
  BookOpen,
  Search,
  Trash2,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { FlashcardSet, FlashcardFolder, Flashcard } from '../../../core/entities';
import {
  getFlashcardFolders,
  getFlashcardSets,
  getFlashcardsInSet,
  deleteFlashcardFolder,
  deleteFlashcardSet,
} from '../../../infrastructure/api/talk2meApi';
import { FlashcardSetEditor } from './FlashcardSetEditor';
import { FlashcardPlayer } from './FlashcardPlayer';
import { FlashcardFolderModal } from './FlashcardFolderModal';
import { PageLoadingSpinner } from '../common/LoadingSpinner';
import { useFlashcardDeckQuery, useDeleteFlashcardFolderMutation, useDeleteFlashcardSetMutation } from '../../../application/queries/useFlashcardsQuery';
import { useQueryClient } from '@tanstack/react-query';

interface FlashcardDeckProps {
  cards?: Flashcard[];
  onReviewFinished?: () => void;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: deckData, isLoading, error: deckError } = useFlashcardDeckQuery();
  const loadError = deckError ? (deckError instanceof Error ? deckError.message : 'Không tải được flashcard') : null;
  const deleteSetMutation = useDeleteFlashcardSetMutation();
  const deleteFolderMutation = useDeleteFlashcardFolderMutation();

  // Local state fallbacks for instant optimistic UI updates
  const [localFolders, setLocalFolders] = useState<FlashcardFolder[] | null>(null);
  const [localStudySets, setLocalStudySets] = useState<FlashcardSet[] | null>(null);

  const folders = localFolders ?? (deckData?.folders || []);
  const studySets = localStudySets ?? (deckData?.studySets || []);

  const [viewState, setViewState] = useState<'dashboard' | 'folder-detail' | 'player' | 'editor'>('dashboard');
  
  const [selectedFolder, setSelectedFolder] = useState<FlashcardFolder | null>(null);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [editingSet, setEditingSet] = useState<FlashcardSet | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FlashcardFolder | null>(null);

  const [activeTab, setActiveTab] = useState<'sets' | 'folders'>('sets');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  // Deep-link URL searchParams sync on mount / URL change
  useEffect(() => {
    if (isLoading || studySets.length === 0) return;

    const urlSetId = searchParams.get('set');
    const urlFolderId = searchParams.get('folder');
    const urlAction = searchParams.get('action');
    const urlTab = searchParams.get('tab');

    if (urlSetId) {
      const foundSet = studySets.find((s) => s.id === urlSetId);
      if (foundSet) {
        if (urlAction === 'edit') {
          setEditingSet(foundSet);
          setViewState('editor');
        } else if (!selectedSet || selectedSet.id !== urlSetId) {
          openSet(foundSet, false);
        }
      }
    } else if (urlFolderId) {
      const foundFolder = folders.find((f) => f.id === urlFolderId);
      if (foundFolder && (!selectedFolder || selectedFolder.id !== urlFolderId)) {
        setSelectedFolder(foundFolder);
        setViewState('folder-detail');
      }
    } else if (urlAction === 'create') {
      setEditingSet(null);
      setViewState('editor');
    }

    if ((urlTab === 'sets' || urlTab === 'folders') && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [isLoading, studySets.length, searchParams.get('set'), searchParams.get('folder'), searchParams.get('action'), searchParams.get('tab')]);

  // Set summaries returned by the list endpoints don't include each card (that would be
  // wasteful for a dashboard grid) — fetch the full card list lazily the moment the user
  // actually opens a set to study/edit it.
  const openSet = async (set: FlashcardSet, updateUrl: boolean = true) => {
    if (updateUrl) {
      setSearchParams({ set: set.id }, { replace: true });
    }
    if (set.cards.length === 0 && (set.cardsCount ?? 0) > 0) {
      try {
        const cards = await getFlashcardsInSet(set.id);
        const hydrated = { ...set, cards };
        setLocalStudySets((prev) => (prev || studySets).map((s) => (s.id === set.id ? hydrated : s)));
        setSelectedSet(hydrated);
      } catch {
        setSelectedSet(set);
      }
    } else {
      setSelectedSet(set);
    }
    setViewState('player');
  };

  const openFolder = (folder: FlashcardFolder, updateUrl: boolean = true) => {
    if (updateUrl) {
      setSearchParams({ folder: folder.id }, { replace: true });
    }
    setSelectedFolder(folder);
    setViewState('folder-detail');
  };

  const openCreateEditor = (updateUrl: boolean = true) => {
    if (updateUrl) {
      setSearchParams({ action: 'create' }, { replace: true });
    }
    setEditingSet(null);
    setViewState('editor');
  };

  const goToDashboard = () => {
    setSearchParams({}, { replace: true });
    setSelectedFolder(null);
    setViewState('dashboard');
  };

  const selectTab = (tab: 'sets' | 'folders') => {
    setActiveTab(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (query) {
        next.set('q', query);
      } else {
        next.delete('q');
      }
      return next;
    }, { replace: true });
  };

  const handleSaveSet = (newSet: FlashcardSet, practiceNow: boolean = false) => {
    setLocalStudySets((prev) => {
      const current = prev || studySets;
      const exists = current.some((s) => s.id === newSet.id);
      if (exists) {
        return current.map((s) => (s.id === newSet.id ? newSet : s));
      }
      return [newSet, ...current];
    });

    if (newSet.folderId) {
      setLocalFolders((prevFolders) =>
        (prevFolders || folders).map((f) => {
          if (f.id === newSet.folderId && !f.setIds.includes(newSet.id)) {
            return { ...f, setIds: [...f.setIds, newSet.id] };
          }
          return f;
        })
      );
    }

    queryClient.invalidateQueries({ queryKey: ['flashcard-deck'] });

    if (practiceNow) {
      setSelectedSet(newSet);
      setViewState('player');
    } else {
      setViewState('dashboard');
    }
  };

  const handleSaveFolder = (folder: FlashcardFolder) => {
    setLocalFolders((prev) => {
      const current = prev || folders;
      const exists = current.some((f) => f.id === folder.id);
      if (exists) {
        return current.map((f) => (f.id === folder.id ? folder : f));
      }
      return [folder, ...current];
    });
    queryClient.invalidateQueries({ queryKey: ['flashcard-deck'] });
  };

  const handleDeleteSet = (setId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa học phần này?')) {
      deleteSetMutation.mutate(setId);
      setLocalStudySets((prev) => (prev || studySets).filter((s) => s.id !== setId));
      if (selectedSet?.id === setId) {
        setSelectedSet(null);
        goToDashboard();
      }
    }
  };

  const handleDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa thư mục này? (Các học phần bên trong vẫn sẽ giữ nguyên)')) {
      deleteFolderMutation.mutate(folderId);
      setLocalFolders((prev) => (prev || folders).filter((f) => f.id !== folderId));
      if (selectedFolder?.id === folderId) {
        goToDashboard();
      }
    }
  };

  const filteredSets = studySets.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFolders = folders.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <PageLoadingSpinner message="Đang tải học phần & thư mục Flashcard..." />;
  }

  if (viewState === 'editor') {
    return (
      <FlashcardSetEditor
        initialSet={editingSet}
        folders={folders}
        onSaveSet={handleSaveSet}
        onCancel={goToDashboard}
      />
    );
  }

  if (viewState === 'player' && selectedSet) {
    return (
      <FlashcardPlayer
        set={selectedSet}
        onBack={goToDashboard}
        onEditSet={() => {
          setEditingSet(selectedSet);
          setViewState('editor');
        }}
      />
    );
  }

  if (viewState === 'folder-detail' && selectedFolder) {
    const setsInFolder = studySets.filter((s) => selectedFolder.setIds.includes(s.id) || s.folderId === selectedFolder.id);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
        
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={goToDashboard}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-[#1E293B] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1B1F2E] dark:text-white font-extrabold text-xs flex items-center gap-2 transition-all duration-200 border border-[#E4E8F0] dark:border-[#334155] shadow-xs active:scale-95 cursor-pointer shrink-0 group"
              title="Quay lại"
            >
              <ArrowLeft className="w-4 h-4 text-[#2E68FF] group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại</span>
            </button>

            <div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                Thư mục học tập
              </span>
              <h1 className="text-2xl font-black text-[#1B1F2E] dark:text-white flex items-center gap-2 mt-1">
                <Folder className="w-6 h-6 text-[#2E68FF]" />
                <span>{selectedFolder.name}</span>
              </h1>
              {selectedFolder.description && (
                <p className="text-xs text-slate-500 mt-1">{selectedFolder.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditingFolder(selectedFolder);
                setIsFolderModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-colors"
            >
              Chỉnh sửa thư mục
            </button>

            <button
              onClick={() => openCreateEditor()}
              className="px-5 py-2.5 rounded-xl bg-[#2E68FF] text-white font-extrabold text-xs shadow-md hover:bg-blue-600 transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm học phần mới</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Các học phần trong thư mục ({setsInFolder.length})
          </h2>

          {setsInFolder.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1E293B] border border-dashed border-[#E4E8F0] dark:border-[#334155] space-y-3">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Thư mục này chưa có học phần nào</h3>
              <p className="text-xs text-slate-500">Tạo học phần mới hoặc chỉnh sửa thư mục để thêm các học phần có sẵn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {setsInFolder.map((set) => (
                <div
                  key={set.id}
                  onClick={() => openSet(set)}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs hover:shadow-lg hover:border-[#2E68FF] cursor-pointer transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#2E68FF] font-bold text-[10px]">
                        {(set.cardsCount ?? set.cards.length)} thẻ
                      </span>
                      {set.isPublic ? (
                        <Globe className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#1B1F2E] dark:text-white group-hover:text-[#2E68FF] transition-colors line-clamp-2">
                      {set.title}
                    </h3>

                    {set.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {set.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-[11px]">Tạo bởi Bạn</span>
                    <ChevronRight className="w-4 h-4 text-[#2E68FF] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl font-black text-[#1B1F2E] dark:text-white tracking-tight">
            Flashcard của tôi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Quản lý và ôn luyện các bộ thẻ ghi nhớ cũng như thư mục trong thư viện của bạn
          </p>
        </div>

        {isLoading && (
          <span className="text-xs font-semibold text-slate-400">Đang tải...</span>
        )}
        {loadError && (
          <span className="text-xs font-semibold text-red-500">{loadError}</span>
        )}

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              placeholder="Tìm kiếm học phần..."
              className="w-full pl-9 pr-4 py-2.5 rounded-full bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#2E68FF] shadow-xs"
            />
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="px-5 py-2.5 rounded-full bg-[#2E68FF] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all active:scale-95"
            >
              <Plus className={`w-4 h-4 transition-transform duration-200 ${isCreateMenuOpen ? 'rotate-45' : ''}`} />
              <span>Tạo mới</span>
            </button>

            {isCreateMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCreateMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      openCreateEditor();
                    }}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#2E68FF]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Thêm học phần mới</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tạo bộ thẻ ghi nhớ mới</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    onClick={() => {
                      setIsCreateMenuOpen(false);
                      setEditingFolder(null);
                      setIsFolderModalOpen(true);
                    }}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-800 dark:text-slate-100 font-bold text-xs transition-colors"
                  >
                    <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600">
                      <FolderPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Tạo thư mục mới</div>
                      <div className="text-[10px] text-slate-400 font-normal">Gom nhóm học phần</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {studySets.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-[#1B1F2E] dark:text-white tracking-tight">
              Jump back in <span className="text-xs text-slate-400 font-normal ml-2">(Ôn nhanh)</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studySets.slice(0, 2).map((set, idx) => (
              <div
                key={set.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] text-slate-800 dark:text-white shadow-xs hover:shadow-md border border-[#E4E8F0] dark:border-[#334155] relative overflow-hidden flex flex-col justify-between h-48 group transition-all"
              >
                <div className="absolute right-4 bottom-3 opacity-15 dark:opacity-20 pointer-events-none group-hover:scale-105 transition-transform">
                  <div className="w-28 h-20 rounded-2xl bg-blue-500/20 dark:bg-blue-400/30 border border-blue-400/30 transform -rotate-6 shadow-xs" />
                </div>

                <div className="space-y-3 z-10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white truncate max-w-[240px]">
                      {set.title}
                    </h3>
                    <span className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors">
                      •••
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: idx === 0 ? '15%' : '100%' }}
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {idx === 0 ? '15% số câu hỏi đã hoàn thành' : `${(set.cardsCount ?? set.cards.length)}/${(set.cardsCount ?? set.cards.length)} thẻ đã xem`}
                    </p>
                  </div>
                </div>

                <div className="z-10 pt-2">
                  <button
                    onClick={() => openSet(set)}
                    className="px-6 py-2.5 rounded-full bg-[#2E68FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-xs transition-transform hover:scale-105 active:scale-95"
                  >
                    Continue (Tiếp tục)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-black text-[#1B1F2E] dark:text-white tracking-tight">
          Recents <span className="text-xs text-slate-400 font-normal ml-2">(Gần đây)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {studySets.map((set) => (
            <div
              key={set.id}
              onClick={() => openSet(set)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-2xs hover:shadow-md hover:border-[#2E68FF] cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-[#2E68FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-extrabold text-[#1B1F2E] dark:text-white truncate group-hover:text-[#2E68FF] transition-colors">
                  {set.title}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  {(set.cardsCount ?? set.cards.length)} cards • by you
                </p>
              </div>
            </div>
          ))}

          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => openFolder(folder)}
              className="p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-2xs hover:shadow-md hover:border-amber-500 cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Folder className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-extrabold text-[#1B1F2E] dark:text-white truncate group-hover:text-amber-600 transition-colors">
                  {folder.name}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Folder • by you
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-[#E4E8F0] dark:border-[#334155] flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => selectTab('sets')}
          className={`px-5 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'sets'
              ? 'bg-[#2E68FF] text-white shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border border-[#E4E8F0] dark:border-[#334155] hover:border-slate-300'
          }`}
        >
          Tất cả học phần ({studySets.length})
        </button>

        <button
          onClick={() => selectTab('folders')}
          className={`px-5 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
            activeTab === 'folders'
              ? 'bg-[#2E68FF] text-white shadow-xs'
              : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border border-[#E4E8F0] dark:border-[#334155] hover:border-slate-300'
          }`}
        >
          Thư mục của tôi ({folders.length})
        </button>
      </div>

      {activeTab === 'sets' && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#1B1F2E] dark:text-white tracking-tight">
            Tất cả học phần ({filteredSets.length})
          </h2>

          {filteredSets.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1E293B] border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa tìm thấy học phần nào</h3>
              <p className="text-xs text-slate-500">Tạo một học phần mới để bắt đầu ôn luyện bằng Flashcard.</p>
              <button
                onClick={() => openCreateEditor()}
                className="px-6 py-2.5 rounded-xl bg-[#2E68FF] text-white font-bold text-xs"
              >
                Tạo học phần ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSets.map((set) => (
                <div
                  key={set.id}
                  onClick={() => openSet(set)}
                  className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs hover:shadow-xl hover:border-[#2E68FF] cursor-pointer transition-all space-y-4 flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-[#2E68FF] font-extrabold text-[10px]">
                        {(set.cardsCount ?? set.cards.length)} thẻ ghi nhớ
                      </span>

                      <div className="flex items-center gap-2">
                        {set.isPublic ? (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Công khai
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Riêng tư
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDeleteSet(set.id, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Xóa học phần"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white group-hover:text-[#2E68FF] transition-colors line-clamp-2">
                      {set.title}
                    </h3>

                    {set.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {set.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-[11px]">Tạo bởi Bạn</span>
                    <ChevronRight className="w-4 h-4 text-[#2E68FF] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'folders' && (
        <div>
          {filteredFolders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#1E293B] border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <Folder className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Chưa có thư mục nào</h3>
              <p className="text-xs text-slate-500">Tạo thư mục để gom nhóm các học phần theo chủ đề gọn gàng.</p>
              <button
                onClick={() => {
                  setEditingFolder(null);
                  setIsFolderModalOpen(true);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#2E68FF] text-white font-bold text-xs"
              >
                Tạo thư mục ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFolders.map((folder) => {
                const count = studySets.filter((s) => folder.setIds.includes(s.id) || s.folderId === folder.id).length;

                return (
                  <div
                    key={folder.id}
                    onClick={() => openFolder(folder)}
                    className="p-6 rounded-3xl bg-white dark:bg-[#1E293B] border border-[#E4E8F0] dark:border-[#334155] shadow-xs hover:shadow-xl hover:border-blue-500 cursor-pointer transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-[#2E68FF] flex items-center justify-center">
                          <Folder className="w-5 h-5 fill-blue-500/20" />
                        </div>

                        <button
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Xóa thư mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-lg font-extrabold text-[#1B1F2E] dark:text-white group-hover:text-[#2E68FF] transition-colors">
                        {folder.name}
                      </h3>

                      {folder.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {folder.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="font-extrabold text-blue-600 text-xs">
                        {count} học phần
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#2E68FF] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <FlashcardFolderModal
        isOpen={isFolderModalOpen}
        initialFolder={editingFolder}
        allSets={studySets}
        onClose={() => setIsFolderModalOpen(false)}
        onSaveFolder={handleSaveFolder}
      />

    </div>
  );
};
