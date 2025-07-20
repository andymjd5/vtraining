// src/types/ticket.ts

import { UserRole } from './index';

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdBy: string; // User ID
  createdByUserRole: UserRole;
  companyId?: string;
  assignedTo?: string; // User ID of admin
  createdAt: any;
  updatedAt?: any;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  content: string;
  createdBy: string; // User ID
  createdAt: any;
}