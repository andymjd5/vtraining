// src/pages/company-admin/CompanyAdminTickets.tsx

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { Ticket } from '../../types';
import { getTickets, respondToTicket, closeTicket, markTicketAsReadByAdmin } from '../../services/ticketService';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Badge from '../../components/ui/Badge';

const CompanyAdminTickets = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!user?.companyId || !user.role) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const companyTickets = await getTickets({ role: user.role, companyId: user.companyId });
      
      // Vérifier que companyTickets est bien un tableau
      if (Array.isArray(companyTickets)) {
        setTickets(companyTickets);
      } else {
        console.warn('getTicketsByCompany n\'a pas retourné un tableau:', companyTickets);
        setTickets([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des tickets:', err);
      setError('Erreur lors du chargement des tickets.');
      showError('Erreur lors du chargement des tickets.');
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId, showError]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectTicket = async (ticket: Ticket) => {
    try {
      if (ticket.adminHasUnreadMessage) {
        await markTicketAsReadByAdmin(ticket.id);
        // Mettre à jour le ticket localement pour éviter un rechargement complet
        setTickets(prevTickets =>
          prevTickets.map(t =>
            t.id === ticket.id
              ? { ...t, adminHasUnreadMessage: false }
              : t
          )
        );
      }
      setSelectedTicket(ticket);
      setResponse(''); // Clear previous response
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      // Continuer même si le marquage échoue
      setSelectedTicket(ticket);
      setResponse('');
    }
  };

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim() || !user?.id) return;
    
    setIsSubmitting(true);
    
    try {
      await respondToTicket(selectedTicket.id, response, user.id);
      success('Réponse envoyée avec succès.');
      setResponse('');
      setSelectedTicket(null);
      await fetchTickets(); // Recharger les tickets
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la réponse:', err);
      showError("Erreur lors de l'envoi de la réponse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (ticketId: string) => {
    try {
      await closeTicket(ticketId);
      success('Ticket clôturé.');
      await fetchTickets(); // Recharger les tickets
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
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
      
      // Gérer différents types de timestamp (Firestore Timestamp ou Date)
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

  const formatDateShort = (timestamp: any) => {
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
      
      return format(date, 'd MMM yyyy', { locale: fr });
    } catch (err) {
      console.error('Erreur lors du formatage de la date:', err);
      return 'Date invalide';
    }
  };

  // Debug: Compter les tickets non lus
  const unreadCount = tickets.filter(ticket => ticket.adminHasUnreadMessage).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Chargement des tickets...</div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (error && tickets.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Gestion des Tickets</h1>
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
      <h1 className="text-3xl font-bold mb-6">Gestion des Tickets</h1>

      {selectedTicket ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <Button 
            onClick={() => setSelectedTicket(null)} 
            variant="secondary" 
            className="mb-4"
          >
            Retour à la liste
          </Button>
          
          <h2 className="text-2xl font-bold mb-2">{selectedTicket.subject}</h2>
          
          <div className="text-sm text-gray-600 mb-4">
            <p>De: {selectedTicket.userName} ({selectedTicket.userEmail})</p>
            <p>Reçu le: {formatDate(selectedTicket.createdAt)}</p>
            <div className="mt-2">
              <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                {selectedTicket.status}
              </Badge>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Message:</h3>
            <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
              {selectedTicket.message}
            </p>
          </div>

          {selectedTicket.responseMessage && (
            <div className="mb-6 border-t pt-4">
              <h3 className="font-semibold text-lg">Votre réponse</h3>
              <p className="text-gray-800 whitespace-pre-wrap bg-blue-50 p-4 rounded-md mt-2">
                {selectedTicket.responseMessage}
              </p>
            </div>
          )}

          {selectedTicket.status !== 'clos' && (
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-2">Répondre:</h3>
              <textarea
                rows={5}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Votre réponse..."
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button 
                  onClick={handleRespond} 
                  disabled={isSubmitting || !response.trim()}
                >
                  {isSubmitting ? 'Envoi...' : 'Répondre'}
                </Button>
                <Button 
                  onClick={() => handleClose(selectedTicket.id)} 
                  variant="error"
                >
                  Clôturer
                </Button>
              </div>
            </div>
          )}

          {selectedTicket.status === 'clos' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <p className="text-gray-600 text-center">Ce ticket est clôturé.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg">
          {tickets.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {tickets.map(ticket => (
                <li 
                  key={ticket.id} 
                  onClick={() => handleSelectTicket(ticket)} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-lg">{ticket.subject}</p>
                      {ticket.adminHasUnreadMessage && (
                        <span 
                          className="h-3 w-3 bg-red-500 rounded-full flex-shrink-0" 
                          title="Nouveau message"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateShort(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {ticket.userName} - {ticket.userEmail}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 truncate">
                    {ticket.message}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">Aucun ticket à afficher.</p>
              <Button onClick={fetchTickets} className="mt-4">
                Actualiser
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyAdminTickets;