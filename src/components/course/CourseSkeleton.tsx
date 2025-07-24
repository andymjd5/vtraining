import React from 'react';
import Card from '../ui/Card';

const CourseSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
    <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
      <div className="flex space-x-4">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
    </div>
  </div>
);

export default CourseSkeleton; 