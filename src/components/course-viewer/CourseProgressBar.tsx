import React from 'react';

interface CourseProgressBarProps {
  progressPercentage: number;
  timeSpent: number;
  estimatedTimeRemaining: number;
}

const CourseProgressBar: React.FC<CourseProgressBarProps> = ({
  progressPercentage,
  timeSpent,
  estimatedTimeRemaining
}) => {
  // TODO: Affichage de la barre de progression et des stats
  return (
    <div>
      {/* Barre de progression à implémenter */}
    </div>
  );
};

export default CourseProgressBar; 