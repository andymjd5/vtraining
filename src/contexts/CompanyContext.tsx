// src/contexts/CompanyContext.tsx
import React, { createContext, useState, ReactNode, useContext } from 'react';

interface CompanyContextProps {
  companyId: string | null;
  selectCompany: (id: string) => void;
}

export const CompanyContext = createContext<CompanyContextProps>({
  companyId: null,
  selectCompany: () => {},
});

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const selectCompany = (id: string) => setCompanyId(id);

  return (
    <CompanyContext.Provider value={{ companyId, selectCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}