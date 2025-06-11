import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'danger';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', className = '', ...props }) => {
  const variants: Record<string, string> = {
    default: 'bg-indigo-100 text-indigo-700',
    secondary: 'bg-gray-200 text-gray-800',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${variants[variant]} ${className}`} {...props} />
  );
};

export default Badge;
