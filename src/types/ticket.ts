// src/types/ticket.ts

import { UserRole } from './index';

export type TicketStatus = 'ouvert' | 'répondu' | 'clos';

export interface Ticket {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  createdAt: any; // Firestore Timestamp
  status: TicketStatus;
  responseMessage?: string;
  responseAt?: any; // Firestore Timestamp
  respondedBy?: string; // admin UID
  companyName?: string;
  studentHasUnreadUpdate?: boolean;
  adminHasUnreadMessage?: boolean;
  adminReadAt?: any; // Firestore Timestamp
}

export interface TicketComment {
  id: string;
  content: string;
  createdBy: string; // User ID
  createdAt: any;
}