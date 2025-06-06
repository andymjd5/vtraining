export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Company {
  id: string;
  name: string;
  urlSlug: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
  companyId?: string;
}