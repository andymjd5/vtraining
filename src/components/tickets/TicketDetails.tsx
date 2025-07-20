// src/components/tickets/TicketDetails.tsx

import { useEffect, useState } from 'react';
import { Ticket, TicketComment, TicketStatus, TicketPriority } from '../../types';
import { getTicketById, updateTicket, addCommentToTicket } from '../../services/ticketService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface TicketDetailsProps {
  ticketId: string;
  onBack: () => void;
}

const TicketDetails = ({ ticketId, onBack }: TicketDetailsProps) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');

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

  const handleUpdateTicket = async (updates: Partial<Ticket>) => {
    if (!ticket) return;
    try {
      await updateTicket(ticket.id, updates);
      setTicket({ ...ticket, ...updates });
      success('Ticket mis à jour.');
    } catch (err) {
      showError('Erreur lors de la mise à jour.');
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !comment.trim() || !user) return;
    try {
      await addCommentToTicket(ticket.id, comment, user.id);
      const newComment: TicketComment = {
        id: new Date().toISOString(), // Temporary ID
        content: comment,
        createdBy: user.id,
        createdAt: new Date(),
      };
      setTicket({ ...ticket, comments: [...(ticket.comments || []), newComment] });
      setComment('');
      success('Commentaire ajouté.');
    } catch (err) {
      showError("Erreur lors de l'ajout du commentaire.");
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!ticket) return <div>Ticket non trouvé.</div>;

  return (
    <div>
      <Button onClick={onBack} variant="secondary" className="mb-4">Retour</Button>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{ticket.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Détails du ticket</p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* ... Other details ... */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{ticket.description}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6">
        <h4 className="text-lg font-medium">Commentaires</h4>
        {/* ... Comments list ... */}
        <div className="mt-4">
          <textarea 
            rows={3} 
            className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
          />
          <Button onClick={handleAddComment} className="mt-2">Commenter</Button>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;