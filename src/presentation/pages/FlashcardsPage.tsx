import React from 'react';
import { Layers } from 'lucide-react';
import { useAuth } from '../../application';
import { RequireAuthGate } from '../components/auth';
import { FlashcardDeck } from '../components/flashcards';

interface FlashcardsPageProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
}

export const FlashcardsPage: React.FC<FlashcardsPageProps> = ({ onOpenAuth }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <RequireAuthGate
        icon={Layers}
        title="Đăng nhập để dùng Flashcard"
        description="Flashcard cần tài khoản để lưu bộ thẻ, thư mục và tiến độ ôn tập SRS của riêng bạn."
        benefits={[
          'Tạo & lưu không giới hạn bộ thẻ ghi nhớ',
          'Ôn tập theo lịch SRS cá nhân hoá',
          'Đồng bộ tiến độ trên mọi thiết bị',
        ]}
        onOpenAuth={onOpenAuth}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <FlashcardDeck />
    </div>
  );
};
