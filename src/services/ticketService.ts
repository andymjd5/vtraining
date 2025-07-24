// src/services/ticketService.ts

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  orderBy,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Ticket, UserRole } from '../types';
import { getCompanies } from './companyService';

const ticketsCollection = collection(db, 'tickets');

interface GetTicketsOptions {
  role: UserRole | 'student' | 'company-admin' | 'super-admin';
  userId?: string;
  companyId?: string;
}

/**
 * Récupère les tickets en fonction du rôle de l'utilisateur.
 * - 'student': ne récupère que ses propres tickets.
 * - 'company-admin': récupère les tickets de son entreprise.
 * - 'super-admin': récupère tous les tickets.
 */
export const getTickets = async (options: GetTicketsOptions): Promise<Ticket[]> => {
  const { role, userId, companyId } = options;
  let ticketsQuery: Query<DocumentData>;

  switch (role) {
    case UserRole.STUDENT:
    case 'student':
      if (!userId) throw new Error('User ID is required for student role.');
      ticketsQuery = query(
        ticketsCollection,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      break;
    case UserRole.COMPANY_ADMIN:
    case 'company-admin':
      if (!companyId) throw new Error('Company ID is required for company-admin role.');
      ticketsQuery = query(
        ticketsCollection,
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      break;
    case UserRole.SUPER_ADMIN:
    case 'super-admin':
      ticketsQuery = query(ticketsCollection, orderBy('createdAt', 'desc'));
      break;
    default:
      throw new Error('Invalid role specified.');
  }

  try {
    const querySnapshot = await getDocs(ticketsQuery);
    const tickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));

    // Pour le super-admin, enrichir avec les noms d'entreprise de manière optimisée
    if (role === 'super-admin' && tickets.length > 0) {
      const allCompanies = await getCompanies();
      const companyMap = new Map(allCompanies.map(c => [c.id, c.name]));
      
      return tickets.map(ticket => ({
        ...ticket,
        companyName: ticket.companyId ? companyMap.get(ticket.companyId) || 'Inconnue' : 'N/A',
      }));
    }

    return tickets;
  } catch (error) {
    console.error(`Error fetching tickets for role ${role}:`, error);
    throw new Error('Failed to fetch tickets.');
  }
};


/**
 * Crée un nouveau ticket pour un étudiant.
 */
export const createTicket = async (
  ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'responseMessage' | 'responseAt' | 'respondedBy' | 'companyName' | 'studentHasUnreadUpdate' | 'adminHasUnreadMessage'>
): Promise<string> => {
  try {
    const newTicket: Omit<Ticket, 'id' | 'companyName'> = {
      ...ticketData,
      status: 'ouvert',
      createdAt: serverTimestamp(),
      studentHasUnreadUpdate: false,
      adminHasUnreadMessage: true,
    };
    const docRef = await addDoc(ticketsCollection, newTicket);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw new Error('Failed to create ticket');
  }
};

/**
 * Récupère un ticket par son ID.
 */
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    if (ticketDoc.exists()) {
      return { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ticket ${ticketId}:`, error);
    throw new Error('Failed to fetch ticket details');
  }
};

/**
 * Met à jour un ticket, par exemple pour ajouter une réponse ou changer le statut.
 */
export const updateTicket = async (
  ticketId: string,
  updates: Partial<Ticket>
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, updates);
  } catch (error) {
    console.error(`Error updating ticket ${ticketId}:`, error);
    throw new Error('Failed to update ticket');
  }
};

/**
 * Répond à un ticket (par un admin).
 */
export const respondToTicket = async (
  ticketId: string,
  responseMessage: string,
  adminId: string
): Promise<void> => {
  try {
    const updates: Partial<Ticket> = {
      responseMessage,
      respondedBy: adminId,
      status: 'répondu',
      responseAt: serverTimestamp(),
      studentHasUnreadUpdate: true,
      adminHasUnreadMessage: false, // L'admin qui répond n'a plus de message non lu
    };
    await updateTicket(ticketId, updates);
  } catch (error) {
    console.error(`Error responding to ticket ${ticketId}:`, error);
    throw new Error('Failed to respond to ticket');
  }
};

/**
 * Clôture un ticket.
 */
export const closeTicket = async (ticketId: string): Promise<void> => {
  try {
    const updates: Partial<Ticket> = {
      status: 'clos',
      studentHasUnreadUpdate: true,
    };
    await updateTicket(ticketId, updates);
  } catch (error) {
    console.error(`Error closing ticket ${ticketId}:`, error);
    throw new Error('Failed to close ticket');
  }
};

/**
 * Marque un ticket comme lu par l'étudiant.
 */
export const markTicketAsReadByStudent = async (ticketId: string): Promise<void> => {
  try {
    await updateTicket(ticketId, { studentHasUnreadUpdate: false });
  } catch (error) {
    console.error(`Error marking ticket ${ticketId} as read by student:`, error);
    throw new Error('Failed to mark ticket as read');
  }
};

/**
 * Marque un message de ticket comme lu par un admin.
 */
export const markTicketAsReadByAdmin = async (ticketId: string): Promise<void> => {
  try {
    await updateTicket(ticketId, { adminHasUnreadMessage: false });
  } catch (error) {
    console.error(`Error marking ticket ${ticketId} as read by admin:`, error);
    throw new Error('Failed to mark ticket as read');
  }
};

/**
 * Compte les mises à jour non lues pour un étudiant.
 */
export const getUnreadUpdatesCountForStudent = async (userId: string): Promise<number> => {
  try {
    const q = query(
      ticketsCollection,
      where('userId', '==', userId),
      where('studentHasUnreadUpdate', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error(`Error counting unread updates for student ${userId}:`, error);
    return 0; // Ne pas bloquer l'UI pour une erreur de comptage
  }
};

/**
 * Compte les nouveaux tickets non lus pour une entreprise.
 */
export const getUnreadMessagesCountForCompany = async (companyId: string): Promise<number> => {
  try {
    const q = query(
      ticketsCollection,
      where('companyId', '==', companyId),
      where('adminHasUnreadMessage', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error(`Error counting unread messages for company ${companyId}:`, error);
    return 0; // Ne pas bloquer l'UI pour une erreur de comptage
  }
};