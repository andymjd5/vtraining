import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // pourcentage (0 à 100)
}

export const Progress: React.FC<ProgressProps> = ({ value = 0, className = '', ...props }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`} {...props}>
    <div
      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

export default Progress;
