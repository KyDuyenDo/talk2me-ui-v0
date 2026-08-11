import React from 'react';
import { CommunitySection } from '../components/community';

interface CommunityPageProps {
  onSelectCourse?: (courseId: string) => void;
  onOpenFlashcards?: () => void;
}

export const CommunityPage: React.FC<CommunityPageProps> = ({
  onSelectCourse,
  onOpenFlashcards,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <CommunitySection
        onSelectCourse={onSelectCourse}
        onOpenFlashcards={onOpenFlashcards}
      />
    </div>
  );
};
