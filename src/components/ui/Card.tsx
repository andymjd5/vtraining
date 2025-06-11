import React, { ReactNode } from 'react';

// Props principales pour le composant Card
interface CardProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
  elevated?: boolean;
}

// Props pour les sous-composants
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

// Sous-composant CardHeader
export const CardHeader: React.FC<CardHeaderProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`.trim()}>
    {children}
  </div>
);

// Sous-composant CardTitle
export const CardTitle: React.FC<CardTitleProps> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-lg font-semibold text-gray-800 ${className}`.trim()}>
    {children}
  </h3>
);

// Sous-composant CardContent
export const CardContent: React.FC<CardContentProps> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`px-6 py-5 ${className}`.trim()}>
    {children}
  </div>
);

// Composant Card principal
const Card: React.FC<CardProps> = ({
  children,
  className = '',
  bordered = false,
  elevated = true,
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  const borderClasses = bordered ? 'border border-gray-200' : '';
  const elevationClasses = elevated ? 'shadow-md hover:shadow-lg transition-shadow duration-200' : '';
  
  const combinedClasses = [baseClasses, borderClasses, elevationClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

// Export des composants
export default Card;
