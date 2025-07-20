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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Ticket, TicketStatus, TicketPriority, UserRole } from '../types';

const ticketsCollection = collection(db, 'tickets');

/**
 * Crée un nouveau ticket.
 */
export const createTicket = async (
  title: string,
  description: string,
  createdBy: string,
  createdByUserRole: UserRole,
  companyId?: string
): Promise<string> => {
  try {
    const newTicket: Omit<Ticket, 'id' | 'comments'> = {
      title,
      description,
      status: TicketStatus.OPEN,
      priority: TicketPriority.MEDIUM, // Default priority
      createdBy,
      createdByUserRole,
      companyId: companyId || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(ticketsCollection, newTicket);
    return docRef.id;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw new Error('Failed to create ticket');
  }
};

/**
 * Récupère tous les tickets pour un Super Admin.
 */
export const getAllTicketsForSuperAdmin = async (): Promise<Ticket[]> => {
  try {
    const q = query(ticketsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    throw new Error('Failed to fetch tickets');
  }
};

/**
 * Récupère les tickets pour une entreprise spécifique (Company Admin).
 */
export const getTicketsByCompany = async (companyId: string): Promise<Ticket[]> => {
  try {
    const q = query(
      ticketsCollection,
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
  } catch (error) {
    console.error(`Error fetching tickets for company ${companyId}:`, error);
    throw new Error('Failed to fetch company tickets');
  }
};

/**
 * Récupère les tickets créés par un utilisateur spécifique (Étudiant).
 */
export const getTicketsByUser = async (userId: string): Promise<Ticket[]> => {
    try {
      const q = query(
        ticketsCollection,
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
    } catch (error) {
      console.error(`Error fetching tickets for user ${userId}:`, error);
      throw new Error('Failed to fetch user tickets');
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
 * Met à jour le statut ou la priorité d'un ticket.
 */
export const updateTicket = async (
  ticketId: string,
  updates: Partial<{ status: TicketStatus; priority: TicketPriority; assignedTo: string }>
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating ticket ${ticketId}:`, error);
    throw new Error('Failed to update ticket');
  }
};

/**
 * Ajoute un commentaire à un ticket.
 */
export const addCommentToTicket = async (
  ticketId: string,
  content: string,
  createdBy: string
): Promise<void> => {
  try {
    const comment = {
      content,
      createdBy,
      createdAt: serverTimestamp(),
    };
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketDoc = await getDoc(ticketRef);
    const ticketData = ticketDoc.data() as Ticket;
    
    const updatedComments = [...(ticketData.comments || []), comment];
    
    await updateDoc(ticketRef, {
      comments: updatedComments,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error adding comment to ticket ${ticketId}:`, error);
    throw new Error('Failed to add comment');
  }
};