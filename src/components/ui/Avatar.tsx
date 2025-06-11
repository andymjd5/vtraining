import React from 'react';

export const Avatar: React.FC<{ className?: string, children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`inline-flex items-center justify-center rounded-full bg-gray-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const AvatarImage: React.FC<{ src?: string, alt?: string }> = ({ src, alt }) =>
  src ? <img src={src} alt={alt} className="w-full h-full object-cover" /> : null;

export const AvatarFallback: React.FC<{ className?: string, children?: React.ReactNode }> = ({ className = '', children }) => (
  <span className={`flex items-center justify-center w-full h-full text-gray-600 ${className}`}>
    {children}
  </span>
);
