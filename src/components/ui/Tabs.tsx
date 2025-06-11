import React, { useState, ReactNode, createContext, useContext } from 'react';

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: ReactNode;
}
const TabsContext = createContext<{ value: string; setValue: (val: string) => void }>({ value: '', setValue: () => {} });

export const Tabs: React.FC<TabsProps> = ({ defaultValue, className = '', children }) => {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ className?: string; children: ReactNode }> = ({ className = '', children }) => (
  <div className={`flex border-b ${className}`}>{children}</div>
);

export const TabsTrigger: React.FC<{ value: string; className?: string; children: ReactNode }> = ({ value, className = '', children }) => {
  const { value: selected, setValue } = useContext(TabsContext);
  return (
    <button
      className={`px-4 py-2 -mb-px font-medium border-b-2 transition-colors ${
        selected === value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-indigo-600'
      } ${className}`}
      onClick={() => setValue(value)}
      type="button"
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; className?: string; children: ReactNode }> = ({ value, className = '', children }) => {
  const { value: selected } = useContext(TabsContext);
  if (selected !== value) return null;
  return <div className={className}>{children}</div>;
};
