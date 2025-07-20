// src/pages/super-admin/TicketManagement.tsx

import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '../../types';
import { getAllTicketsForSuperAdmin } from '../../services/ticketService';
import TicketList from '../../components/tickets/TicketList';
import TicketDetails from '../../components/tickets/TicketDetails';
import { useToast } from '../../hooks/useToast';

const TicketManagement = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedTickets = await getAllTicketsForSuperAdmin();
      setTickets(fetchedTickets);
    } catch (err) {
      showError('Erreur lors du chargement des tickets.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
  };

  const handleBack = () => {
    setSelectedTicketId(null);
  };

  if (loading) {
    return <div>Chargement des tickets...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des Tickets</h1>
      {selectedTicketId ? (
        <TicketDetails ticketId={selectedTicketId} onBack={handleBack} />
      ) : (
        <TicketList tickets={tickets} onSelectTicket={handleSelectTicket} />
      )}
    </div>
  );
};

export default TicketManagement;