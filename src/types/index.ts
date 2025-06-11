// src/types/index.ts

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  AGENT = 'AGENT',      // Si tu veux garder AGENT
  STUDENT = 'STUDENT'   // Ajoute STUDENT si besoin dans ton projet
}

export interface Company {
  id: string;
  name: string;
  urlSlug?: string;          // Peut être optionnel si non utilisé partout
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;             // Peut parfois être optionnel selon la base
  fullName?: string;
  displayName?: string;
  role: UserRole;
  companyId?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  company?: Company;         // Si tu fais du "populate"
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
  companyId?: string;
}
