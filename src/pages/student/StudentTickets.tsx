// src/pages/student/StudentTickets.tsx

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Ticket } from '../../types';
import { getTickets, createTicket, closeTicket, markTicketAsReadByStudent, respondToTicket } from '../../services/ticketService';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Badge from '../../components/ui/Badge';

const StudentTickets = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!user?.id || !user.role) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const userTickets = await getTickets({ role: user.role, userId: user.id });
      
      // Vérifier que userTickets est bien un tableau
      if (Array.isArray(userTickets)) {
        setTickets(userTickets);
      } else {
        console.warn('getTicketsByUser n\'a pas retourné un tableau:', userTickets);
        setTickets([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des tickets:', err);
      setError('Erreur lors du chargement de vos tickets.');
      showError('Erreur lors du chargement de vos tickets.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, showError]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleTicketClick = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    
    try {
      if (ticket && ticket.studentHasUnreadUpdate) {
        await markTicketAsReadByStudent(ticketId);
        // Mettre à jour le ticket localement
        setTickets(prevTickets => 
          prevTickets.map(t => 
            t.id === ticketId 
              ? { ...t, studentHasUnreadUpdate: false }
              : t
          )
        );
      }
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      // Continuer même si le marquage échoue
    }
    
    setSelectedTicketId(prevId => (prevId === ticketId ? null : ticketId));
    setReplyMessage(''); // Reset reply message when switching tickets
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.companyId) {
      showError("Impossible de créer un ticket sans être associé à une entreprise.");
      return;
    }
    if (!subject.trim() || !message.trim()) {
      showError('Le sujet et le message sont requis.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketData = {
        userId: user.id,
        userName: user.name || 'N/A',
        userEmail: user.email,
        companyId: user.companyId,
        subject,
        message,
      };
      await createTicket(ticketData);
      success('Ticket envoyé avec succès !');
      setSubject('');
      setMessage('');
      setIsFormVisible(false);
      await fetchTickets(); // Refresh the list
    } catch (err) {
      console.error('Erreur lors de la création du ticket:', err);
      showError((err as Error).message || 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyToTicket = async (ticketId: string) => {
    if (!user?.id || !replyMessage.trim()) return;
    
    setIsReplying(true);
    try {
      await respondToTicket(ticketId, replyMessage, user.id);
      success('Réponse envoyée avec succès !');
      setReplyMessage('');
      await fetchTickets(); // Refresh to get updated ticket
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la réponse:', err);
      showError('Erreur lors de l\'envoi de votre réponse.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    try {
      await closeTicket(ticketId);
      success('Ticket clôturé avec succès.');
      await fetchTickets();
      if (selectedTicketId === ticketId) {
        setSelectedTicketId(null);
      }
    } catch (err) {
      console.error('Erreur lors de la clôture du ticket:', err);
      showError('Erreur lors de la clôture du ticket.');
    }
  };
  
  const getStatusBadgeVariant = (status: Ticket['status']): 'default' | 'secondary' | 'success' | 'danger' => {
    switch (status) {
      case 'ouvert':
        return 'success';
      case 'répondu':
        return 'default';
      case 'clos':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      if (!timestamp) return 'Date inconnue';
      
      let date: Date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else {
        return 'Date invalide';
      }
      
      return format(date, 'd MMM yyyy à HH:mm', { locale: fr });
    } catch (err) {
      console.error('Erreur lors du formatage de la date:', err);
      return 'Date invalide';
    }
  };

  const canCreateTicket = !tickets.some(t => t.status !== 'clos');

  // État de chargement
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement de vos tickets...</div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error && tickets.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Mes Tickets de Support</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <Button onClick={fetchTickets} className="mt-2">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes Tickets de Support</h1>
        <Button 
          onClick={() => setIsFormVisible(!isFormVisible)}
          disabled={!canCreateTicket}
          variant={canCreateTicket ? 'primary' : 'secondary'}
        >
          {isFormVisible ? 'Annuler' : 'Nouveau Ticket'}
        </Button>
      </div>

      {!canCreateTicket && !isFormVisible && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
          <p className="font-bold">Action requise</p>
          <p>Vous avez un ticket en cours. Veuillez le clôturer avant d'en créer un nouveau.</p>
        </div>
      )}

      {isFormVisible && canCreateTicket && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Créer un nouveau ticket</h2>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Sujet</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Décrivez brièvement votre problème"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
                placeholder="Décrivez votre problème en détail"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsFormVisible(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting || !subject.trim() || !message.trim()}>
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le Ticket'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 text-lg mb-4">Vous n'avez aucun ticket pour le moment.</p>
            <Button onClick={() => setIsFormVisible(true)}>
              Créer votre premier ticket
            </Button>
          </div>
        ) : (
          tickets.map(ticket => (
            <div 
              key={ticket.id} 
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div 
                className="p-5 cursor-pointer"
                onClick={() => handleTicketClick(ticket.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-xl">{ticket.subject}</h3>
                    {ticket.studentHasUnreadUpdate && (
                      <div className="flex items-center">
                        <span className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" title="Nouvelle mise à jour"></span>
                        <span className="ml-2 text-sm text-blue-600 font-medium">Nouvelle réponse</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(ticket.status)}>
                    {ticket.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  Créé le: {formatDate(ticket.createdAt)}
                </p>
                
                {selectedTicketId !== ticket.id && (
                  <p className="text-gray-600 truncate">
                    {ticket.message}
                  </p>
                )}
              </div>
              
              {selectedTicketId === ticket.id && (
                <div className="px-5 pb-5 border-t bg-gray-50">
                  <div className="pt-4">
                    <h4 className="font-semibold text-lg mb-2">Votre message initial:</h4>
                    <p className="text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-md mb-4">
                      {ticket.message}
                    </p>
                    
                    {ticket.responseMessage && (
                      <div className="mt-4">
                        <h4 className="font-semibold text-lg mb-2 text-green-700">
                          Réponse de l'administrateur
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          Répondu le: {formatDate(ticket.responseAt)}
                        </p>
                        <p className="text-gray-700 bg-green-50 border-l-4 border-green-500 p-3 rounded-md whitespace-pre-wrap mb-4">
                          {ticket.responseMessage}
                        </p>
                      </div>
                    )}

                    {ticket.status !== 'clos' && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="font-semibold text-lg mb-2">Ajouter une réponse:</h4>
                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Tapez votre message ici..."
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <Button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleCloseTicket(ticket.id); 
                            }} 
                            variant="error"
                            size="sm"
                          >
                            Clôturer le ticket
                          </Button>
                          
                          <Button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handleReplyToTicket(ticket.id); 
                            }}
                            disabled={isReplying || !replyMessage.trim()}
                          >
                            {isReplying ? 'Envoi...' : 'Envoyer la réponse'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {ticket.status === 'clos' && (
                      <div className="mt-4 p-4 bg-gray-100 rounded-md text-center">
                        <p className="text-gray-600 font-medium">Ce ticket est clôturé.</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Vous ne pouvez plus ajouter de messages à ce ticket.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentTickets;