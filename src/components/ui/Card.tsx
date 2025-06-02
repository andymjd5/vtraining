import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerActions?: ReactNode;
  footerContent?: ReactNode;
  bordered?: boolean;
  elevated?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerActions,
  footerContent,
  bordered = false,
  elevated = true,
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  const borderClasses = bordered ? 'border border-gray-200' : '';
  const elevationClasses = elevated ? 'shadow-card hover:shadow-card-hover transition-shadow' : '';

  return (
    <div className={`${baseClasses} ${borderClasses} ${elevationClasses} ${className}`}>
      {(title || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      
      <div className="px-6 py-5">{children}</div>
      
      {footerContent && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footerContent}
        </div>
      )}
    </div>
  );
};

export default Card;