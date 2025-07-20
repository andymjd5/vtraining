// src/types/index.ts

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  AGENT = 'AGENT',
  STUDENT = 'STUDENT'
}

export interface Company {
  id: string;
  name: string;
  urlSlug?: string;
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
  name?: string;
  fullName?: string;
  displayName?: string;
  role: UserRole;
  companyId?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  company?: Company;
  enrolledCourses?: string[];
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
  companyId?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  categoryId: string; // Normalisé : référence à la catégorie
  level: string;
  duration: number;
  instructor: {
    name: string;
    title: string;
    photoUrl?: string;
    bio?: string;
  };
  chapters?: Chapter[];
  assignedTo: string[];
  status: 'draft' | 'published';
  createdAt: any;
  updatedAt?: any;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  expanded?: boolean;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  order: number;
  content: ContentBlock[];
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'media';
  content: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    list?: boolean;
    alignment?: 'left' | 'center' | 'right';
  };
  media?: {
    type: 'image' | 'video';
    url: string;
    caption?: string;
  };
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  companyId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  enrolledAt: any;
  lastActivity: any;
  timeSpent?: number;
}

export interface Certificate {
  id: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  companyId: string;
  issueDate: any;
  certificateNumber: string;
  createdAt: any;
}

export interface ProgressTracking {
  id: string;
  enrollmentId: string;
  userId: string;
  courseId: string;
  companyId: string;
  chapterId: string;
  completed: boolean;
  timeSpent: number;
  lastAccessed: any;
}

export interface ActivityLog {
  id: string;
  userId: string;
  companyId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  createdAt: any;
}

export interface CompanyFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  companyId: string;
  path: string;
  url: string;
  uploadedAt: any;
  uploadedBy: string | null;
}
export * from './ticket';