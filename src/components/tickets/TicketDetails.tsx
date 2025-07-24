// src/components/tickets/TicketDetails.tsx

import { useState, useEffect } from 'react';
import { Ticket } from '../../types';
import { getTicketById, respondToTicket, closeTicket } from '../../services/ticketService';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';

interface TicketDetailsProps {
  ticketId: string;
  onBack: () => void;
  isReadOnly?: boolean;
}

const TicketDetails = ({ ticketId, onBack, isReadOnly = false }: TicketDetailsProps) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const fetchedTicket = await getTicketById(ticketId);
        setTicket(fetchedTicket);
      } catch (err) {
        showError('Erreur lors du chargement du ticket.');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId, showError]);

  const handleRespond = async () => {
    if (!ticket || !response.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await respondToTicket(ticket.id, response, user.id);
      success('Réponse envoyée avec succès.');
      setResponse('');
      // Re-fetch ticket to show the new response
      const updatedTicket = await getTicketById(ticketId);
      setTicket(updatedTicket);
    } catch (err) {
      showError("Erreur lors de l'envoi de la réponse.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!ticket) return;
    try {
      await closeTicket(ticket.id);
      success('Ticket clôturé.');
      onBack(); // Go back to the list after closing
    } catch (err) {
      showError('Erreur lors de la clôture du ticket.');
    }
  };

  if (loading) {
    return <div>Chargement du ticket...</div>;
  }

  if (!ticket) {
    return <div>Ticket non trouvé.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <Button onClick={onBack} variant="secondary" className="mb-4">Retour à la liste</Button>
      <h2 className="text-2xl font-bold mb-2">{ticket.subject}</h2>
      <div className="text-sm text-gray-600 mb-4">
        <p>De: {ticket.userName} ({ticket.userEmail})</p>
        <p>Entreprise: {ticket.companyName || 'Non spécifiée'}</p>
        <p>Reçu le: {ticket.createdAt && format(ticket.createdAt.toDate(), 'd MMM yyyy à HH:mm', { locale: fr })}</p>
      </div>
      <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">{ticket.message}</p>

      {ticket.responseMessage && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-lg">Réponse</h3>
          <p className="text-xs text-gray-500 mb-1">
            Par: {ticket.respondedBy} le {ticket.responseAt && format(ticket.responseAt.toDate(), 'd MMM yyyy à HH:mm', { locale: fr })}
          </p>
          <p className="text-gray-800 whitespace-pre-wrap bg-blue-50 p-4 rounded-md mt-2">{ticket.responseMessage}</p>
        </div>
      )}

      {ticket.status !== 'clos' && !isReadOnly && (
        <div className="mt-6">
          <textarea
            rows={5}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Votre réponse..."
          />
          <div className="flex justify-end space-x-2 mt-2">
            <Button onClick={handleRespond} disabled={isSubmitting || !response.trim()}>
              {isSubmitting ? 'Envoi...' : 'Répondre'}
            </Button>
            <Button onClick={handleClose} variant="error">Clôturer</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetails;