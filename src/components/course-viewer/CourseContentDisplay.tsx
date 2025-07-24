import React from 'react';
import ContentBlockViewer from './ContentBlockViewer';

interface CourseContentDisplayProps {
  contentBlock: any;
  onComplete: () => void;
  onStart: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  progress: any; // Added for progress and validateBlock
  validateBlock: (blockId: string) => void;
}

const CourseContentDisplay: React.FC<CourseContentDisplayProps> = ({
  contentBlock,
  onComplete,
  onStart,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  progress,
  validateBlock
}) => {
  React.useEffect(() => {
    if (contentBlock) {
      onStart();
    }
    // eslint-disable-next-line
  }, [contentBlock]);

  if (!contentBlock) {
    return <div>Aucun contenu à afficher.</div>;
  }

  const isValidated = progress?.completedBlocks?.includes(contentBlock.id);

  return (
    <ContentBlockViewer
      block={contentBlock}
      isValidated={isValidated}
      validateBlock={validateBlock}
      onComplete={onComplete}
      onPrev={onPrev}
      onNext={onNext}
      hasPrev={hasPrev}
      hasNext={hasNext}
    />
  );
};

export default CourseContentDisplay; 