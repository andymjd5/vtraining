// src/pages/student/Support.tsx

import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '../../types';
import { getTicketsByUser } from '../../services/ticketService';
import TicketList from '../../components/tickets/TicketList';
import TicketDetails from '../../components/tickets/TicketDetails';
import CreateTicketForm from '../../components/tickets/CreateTicketForm';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';

const Support = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedTickets = await getTicketsByUser(user.id);
      setTickets(fetchedTickets);
    } catch (err) {
      showError('Erreur lors du chargement de vos tickets.');
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowCreateForm(false);
  };

  const handleBack = () => {
    setSelectedTicketId(null);
  };

  const handleTicketCreated = () => {
    setShowCreateForm(false);
    fetchTickets();
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Support</h1>
        {!showCreateForm && !selectedTicketId && (
          <Button onClick={() => setShowCreateForm(true)}>Nouveau Ticket</Button>
        )}
      </div>

      {selectedTicketId ? (
        <TicketDetails ticketId={selectedTicketId} onBack={handleBack} />
      ) : showCreateForm ? (
        <div>
          <h2 className="text-xl font-semibold mb-2">Créer un nouveau ticket</h2>
          <CreateTicketForm onTicketCreated={handleTicketCreated} />
          <Button variant="secondary" onClick={() => setShowCreateForm(false)} className="mt-4">
            Annuler
          </Button>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-2">Mes tickets</h2>
          <TicketList tickets={tickets} onSelectTicket={handleSelectTicket} />
        </div>
      )}
    </div>
  );
};

export default Support;